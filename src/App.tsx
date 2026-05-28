import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AppHeader } from "./components/AppHeader";
import { CameraPreview } from "./components/CameraPreview";
import { ControlRow } from "./components/ControlRow";
import { ExitModal } from "./components/ExitModal";
import { SettingsView } from "./components/SettingsView";
import { StatusLine } from "./components/StatusLine";
import { useCamera } from "./hooks/useCamera";
import { useNailBitingMonitor } from "./hooks/useNailBitingMonitor";

type View = "monitor" | "settings";

export default function App() {
  const camera = useCamera();
  const [sensitivity, setSensitivity] = useState(5);
  const [holdSeconds, setHoldSeconds] = useState(1.5);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [volume, setVolume] = useState(100);
  const [cooldownSeconds, setCooldownSeconds] = useState(8);
  const [appInfo, setAppInfo] = useState("Tauri IPC pending");
  const [view, setView] = useState<View>("monitor");
  const [exitCode, setExitCode] = useState<string | null>(null);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const autoStarted = useRef(false);
  const monitor = useNailBitingMonitor({
    videoRef: camera.videoRef,
    cameraActive: camera.isActive,
    alertsEnabled,
    sensitivity,
    cooldownSeconds,
    holdSeconds,
    volume,
  });

  useEffect(() => {
    invoke<string>("app_info")
      .then(setAppInfo)
      .catch(() => setAppInfo("Tauri IPC available after launching with tauri dev"));
    invoke<string>("get_exit_code")
      .then(setExitCode)
      .catch(() => setExitCode(null));
  }, []);

  useEffect(() => {
    const unlisten = listen("request-exit", () => setExitPromptOpen(true));
    return () => {
      void unlisten.then((off) => off());
    };
  }, []);

  useEffect(() => {
    if (autoStarted.current) {
      return;
    }

    autoStarted.current = true;
    void camera.start();
  }, [camera.start]);

  return (
    <main className="app-shell">
      <AppHeader
        view={view}
        onOpenSettings={() => setView("settings")}
        onBack={() => setView("monitor")}
      />

      {/*
        Keep the monitor view (and its <video>) mounted even while Settings is
        open. Unmounting it tore the live stream off its element, and reattaching
        to a fresh element on return is unreliable in the macOS webview — the feed
        came back black. Hiding instead keeps the camera running.
      */}
      <section className="monitor-view" aria-label="Monitoring" hidden={view !== "monitor"}>
        <CameraPreview
          videoRef={camera.setVideoEl}
          isActive={camera.isActive}
          isStarting={camera.isStarting}
          error={camera.error}
          canOpenSettings={camera.canOpenSettings}
          canResetPermission={camera.canResetPermission}
          phase={monitor.phase}
          score={monitor.result.score}
          nearDurationMs={monitor.result.nearDurationMs}
          onStart={camera.start}
          onOpenSettings={camera.openSettings}
          onResetPermission={camera.resetPermissionAndStart}
        />

        <ControlRow
          isActive={camera.isActive}
          isStarting={camera.isStarting}
          onStart={camera.start}
          onStop={camera.stop}
        />

        <StatusLine
          cameraActive={camera.isActive}
          cameraStarting={camera.isStarting}
          cameraError={camera.error}
          monitorPhase={monitor.phase}
          monitorError={monitor.error}
          score={monitor.result.score}
          nearDurationMs={monitor.result.nearDurationMs}
          lastAlertAt={monitor.lastAlertAt}
          alertsEnabled={alertsEnabled}
        />
      </section>

      {view === "settings" && (
        <SettingsView
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
          holdSeconds={holdSeconds}
          onHoldSecondsChange={setHoldSeconds}
          alertsEnabled={alertsEnabled}
          volume={volume}
          cooldownSeconds={cooldownSeconds}
          onEnabledChange={setAlertsEnabled}
          onVolumeChange={setVolume}
          onCooldownChange={setCooldownSeconds}
          exitCode={exitCode}
          onExit={() => setExitPromptOpen(true)}
          appInfo={appInfo}
        />
      )}

      <ExitModal open={exitPromptOpen} onClose={() => setExitPromptOpen(false)} />
    </main>
  );
}
