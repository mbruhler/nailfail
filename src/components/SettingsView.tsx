import { AlertSettings } from "./AlertSettings";
import { ExitCodeCard } from "./ExitCodeCard";
import { PrivacyNote } from "./PrivacyNote";
import { SensitivityControl } from "./SensitivityControl";

type SettingsViewProps = {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  holdSeconds: number;
  onHoldSecondsChange: (value: number) => void;
  alertsEnabled: boolean;
  volume: number;
  cooldownSeconds: number;
  onEnabledChange: (value: boolean) => void;
  onVolumeChange: (value: number) => void;
  onCooldownChange: (value: number) => void;
  exitCode: string | null;
  onExit: () => void;
  appInfo: string;
};

export function SettingsView({
  sensitivity,
  onSensitivityChange,
  holdSeconds,
  onHoldSecondsChange,
  alertsEnabled,
  volume,
  cooldownSeconds,
  onEnabledChange,
  onVolumeChange,
  onCooldownChange,
  exitCode,
  onExit,
  appInfo,
}: SettingsViewProps) {
  return (
    <section className="settings-view" aria-label="Settings">
      <SensitivityControl
        sensitivity={sensitivity}
        onSensitivityChange={onSensitivityChange}
        holdSeconds={holdSeconds}
        onHoldSecondsChange={onHoldSecondsChange}
      />

      <AlertSettings
        enabled={alertsEnabled}
        volume={volume}
        cooldownSeconds={cooldownSeconds}
        onEnabledChange={onEnabledChange}
        onVolumeChange={onVolumeChange}
        onCooldownChange={onCooldownChange}
      />

      <ExitCodeCard code={exitCode} onExit={onExit} />

      <PrivacyNote />

      <span className="app-info-pill">{appInfo}</span>
    </section>
  );
}
