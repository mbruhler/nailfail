import { Hourglass, SlidersHorizontal } from "lucide-react";

type SensitivityControlProps = {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  holdSeconds: number;
  onHoldSecondsChange: (value: number) => void;
};

export function SensitivityControl({
  sensitivity,
  onSensitivityChange,
  holdSeconds,
  onHoldSecondsChange,
}: SensitivityControlProps) {
  return (
    <section className="settings-block" aria-label="Detection">
      <div className="panel-title">
        <SlidersHorizontal size={18} strokeWidth={1.9} aria-hidden="true" />
        <h2>Detection</h2>
      </div>

      <label className="range-control">
        <span className="range-label">
          <span className="range-name">Sensitivity</span>
          <strong>{sensitivity}</strong>
        </span>
        <input
          type="range"
          min="1"
          max="10"
          value={sensitivity}
          aria-label="Sensitivity"
          onChange={(event) => onSensitivityChange(Number(event.target.value))}
        />
        <span className="range-caption">
          <span>Gentle</span>
          <span>Strict</span>
        </span>
      </label>

      <label className="field-control">
        <span className="field-label">
          <Hourglass size={16} strokeWidth={1.9} aria-hidden="true" />
          Hold time
        </span>
        <span className="number-field">
          <input
            type="number"
            min="0.5"
            max="10"
            step="0.5"
            value={holdSeconds}
            aria-label="Hold time before biting is detected, in seconds"
            onChange={(event) => onHoldSecondsChange(Number(event.target.value))}
          />
          <span>s</span>
        </span>
      </label>

      <span className="range-caption">
        <span>How long fingers must stay at the mouth before an alert fires.</span>
      </span>
    </section>
  );
}
