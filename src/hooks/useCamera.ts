import { useCallback, useEffect, useRef, useState } from "react";
import {
  openNativeCameraSettings,
  requestNativeCameraPermission,
  resetNativeCameraPermission,
} from "../native/cameraPermission";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const [canResetPermission, setCanResetPermission] = useState(false);

  // Callback ref for the <video>. When the monitor view remounts after a
  // settings detour, the stream is still live in streamRef but the new element
  // has no srcObject; reattach it here so the feed resumes without a restart.
  const setVideoEl = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsStarting(false);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) {
      setIsActive(true);
      return;
    }

    setError(null);
    setCanOpenSettings(false);
    setCanResetPermission(false);
    setIsStarting(true);

    try {
      const nativePermission = await requestNativeCameraPermission();

      if (!nativePermission.granted && nativePermission.status !== "unsupported") {
        throw new CameraPermissionError(
          nativePermission.canPrompt
            ? "Camera permission prompt did not complete."
            : "Camera permission denied by macOS.",
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not available in this window.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          // 640x480 is plenty for face/hand landmark detection at webcam
          // distance and uses ~3x less memory than 720p across the video
          // decode buffers, GPU textures, and MediaPipe's WASM image buffers.
          width: { ideal: 640, max: 960 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 24 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setIsStarting(false);
    } catch (cause) {
      stop();
      setError(formatCameraError(cause));
      setCanOpenSettings(isPermissionError(cause));
      setCanResetPermission(isPermissionError(cause));
    }
  }, [stop]);

  const openSettings = useCallback(async () => {
    try {
      await openNativeCameraSettings();
    } catch (cause) {
      setError(formatCameraError(cause));
    }
  }, []);

  const resetPermissionAndStart = useCallback(async () => {
    setError(null);
    setIsStarting(true);

    try {
      await resetNativeCameraPermission();
      await start();
    } catch (cause) {
      setIsStarting(false);
      setError(formatCameraError(cause));
      setCanOpenSettings(true);
      setCanResetPermission(true);
    }
  }, [start]);

  useEffect(() => stop, [stop]);

  return {
    videoRef,
    setVideoEl,
    isActive,
    isStarting,
    error,
    canOpenSettings,
    canResetPermission,
    start,
    stop,
    openSettings,
    resetPermissionAndStart,
  };
}

class CameraPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CameraPermissionError";
  }
}

function formatCameraError(cause: unknown) {
  if (!(cause instanceof Error)) {
    return "Camera permission failed.";
  }

  if (cause.name === "NotAllowedError" || cause.name === "SecurityError") {
    return "Camera permission denied. Click Reset permission & ask again, or allow Nailfail in macOS Camera settings.";
  }

  if (cause.name === "CameraPermissionError") {
    return "Camera permission denied. Click Reset permission & ask again, or allow Nailfail in macOS Camera settings.";
  }

  if (cause.name === "NotFoundError" || cause.name === "DevicesNotFoundError") {
    return "No camera found.";
  }

  if (cause.name === "NotReadableError" || cause.name === "TrackStartError") {
    return "Camera is busy in another app.";
  }

  return cause.message || "Camera permission failed.";
}

function isPermissionError(cause: unknown) {
  return (
    cause instanceof Error &&
    (cause.name === "NotAllowedError" ||
      cause.name === "SecurityError" ||
      cause.name === "CameraPermissionError")
  );
}
