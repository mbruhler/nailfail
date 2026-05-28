import { useEffect, useRef, useState, type RefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { playLocalAlert } from "../alerts/playLocalAlert";
import { evaluateBitingWindow, type DetectionResult } from "../detection/detector";
import { extractFeatureVector, type FeatureVector, type FrameMemory } from "../detection/features";
import { loadVisionTasks } from "../vision/mediapipe";

type MonitorOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  alertsEnabled: boolean;
  sensitivity: number;
  cooldownSeconds: number;
  holdSeconds: number;
  volume: number;
};

type MonitorPhase = "idle" | "loading_models" | "watching" | "suspected_biting" | "confirmed_biting" | "error";

const frameIntervalMs = 1000 / 15;

export function useNailBitingMonitor({
  videoRef,
  cameraActive,
  alertsEnabled,
  sensitivity,
  cooldownSeconds,
  holdSeconds,
  volume,
}: MonitorOptions) {
  const [phase, setPhase] = useState<MonitorPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult>({
    state: "watching",
    score: 0,
    nearDurationMs: 0,
    reason: "watching",
  });
  const [lastAlertAt, setLastAlertAt] = useState<number | null>(null);
  const bufferRef = useRef<FeatureVector[]>([]);
  const lastAlertAtRef = useRef(0);
  const memoryRef = useRef<FrameMemory | undefined>(undefined);

  useEffect(() => {
    if (!cameraActive) {
      setPhase("idle");
      bufferRef.current = [];
      memoryRef.current = undefined;
      return;
    }

    let cancelled = false;
    let timeoutId = 0;

    const holdMs = Math.max(300, holdSeconds * 1000);
    // The rolling buffer must outlast the configured hold time, otherwise the
    // trailing near-frames get trimmed before they can add up to a confirmation.
    const windowMs = holdMs + 1200;

    async function run() {
      setError(null);
      setPhase("loading_models");

      try {
        const tasks = await loadVisionTasks();

        if (cancelled) {
          return;
        }

        setPhase("watching");

        // Driven by setTimeout (not requestAnimationFrame) on purpose: rAF is
        // fully paused while the window is hidden to the tray, which would stop
        // detection — and the block-screen punishment — exactly when we still
        // need to be watching. Timers keep firing while hidden.
        const tick = () => {
          if (cancelled) {
            return;
          }

          const video = videoRef.current;
          const now = performance.now();

          if (
            video &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.videoWidth > 0
          ) {
            const faceResult = tasks.faceLandmarker.detectForVideo(video, now);
            const handResult = tasks.handLandmarker.detectForVideo(video, now);
            const extracted = extractFeatureVector(
              faceResult.faceLandmarks,
              handResult.landmarks,
              memoryRef.current,
            );

            memoryRef.current = extracted.memory;
            bufferRef.current = [...bufferRef.current, extracted.features].filter(
              (frame) => now - frame.timestamp <= windowMs,
            );

            const nextResult = evaluateBitingWindow(bufferRef.current, sensitivity, holdMs);
            setResult(nextResult);
            setPhase(nextResult.state);

            if (
              nextResult.state === "confirmed_biting" &&
              now - lastAlertAtRef.current >= cooldownSeconds * 1000
            ) {
              lastAlertAtRef.current = now;
              setLastAlertAt(Date.now());
              // Hard escalation: always slam a fullscreen block over the screen
              // as the punishment, even when the sound alert is turned off.
              void invoke("trigger_block_screen").catch(() => undefined);
              // Sound respects the alerts toggle.
              if (alertsEnabled) {
                playLocalAlert(volume);
              }
            }
          }

          timeoutId = window.setTimeout(tick, frameIntervalMs);
        };

        timeoutId = window.setTimeout(tick, frameIntervalMs);
      } catch (cause) {
        if (!cancelled) {
          setPhase("error");
          setError(cause instanceof Error ? cause.message : "MediaPipe failed to start");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [alertsEnabled, cameraActive, cooldownSeconds, holdSeconds, sensitivity, videoRef, volume]);

  return {
    phase,
    error,
    result,
    lastAlertAt,
  };
}
