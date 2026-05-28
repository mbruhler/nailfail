import { Bell, BellOff, TimerReset, Volume2 } from "lucide-react";

type AlertSettingsProps = {
  enabled: boolean;
  volume: number;
  cooldownSeconds: number;
  onEnabledChange: (value: boolean) => void;
  onVolumeChange: (value: number) => void;
  onCooldownChange: (value: number) => void;
};

export function AlertSettings({
  enabled,
  volume,
  cooldownSeconds,
  onEnabledChange,
  onVolumeChange,
  onCooldownChange,
}: AlertSettingsProps) {
  return (
    <section className="settings-block" aria-label="Alert settings">
      <div className="panel-title-row">
        <div className="panel-title">
          {enabled ? (
            <Bell size={18} strokeWidth={1.9} aria-hidden="true" />
          ) : (
            <BellOff size={18} strokeWidth={1.9} aria-hidden="true" />
          )}
          <h2>Alerts</h2>
        </div>

        <label className="switch-control">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          <span className="switch-track" aria-hidden="true" />
          <span>{enabled ? "On" : "Off"}</span>
        </label>
      </div>

      <div className="field-grid">
        <label className="field-control">
          <span className="field-label">
            <Volume2 size={16} strokeWidth={1.9} aria-hidden="true" />
            Volume
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            aria-label="Volume"
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
          <strong>{volume}%</strong>
        </label>

        <label className="field-control">
          <span className="field-label">
            <TimerReset size={16} strokeWidth={1.9} aria-hidden="true" />
            Cooldown
          </span>
          <span className="number-field">
            <input
              type="number"
              min="1"
              max="60"
              value={cooldownSeconds}
              aria-label="Cooldown seconds"
              onChange={(event) => onCooldownChange(Number(event.target.value))}
            />
            <span>s</span>
          </span>
        </label>
      </div>
    </section>
  );
}
