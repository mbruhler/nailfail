import { Camera, RotateCcw, Settings, VideoOff } from "lucide-react";
import type { CSSProperties, Ref } from "react";

type CameraPreviewProps = {
  videoRef: Ref<HTMLVideoElement>;
  isActive: boolean;
  isStarting: boolean;
  error: string | null;
  canOpenSettings: boolean;
  canResetPermission: boolean;
  phase: string;
  score: number;
  nearDurationMs: number;
  onStart: () => void;
  onOpenSettings: () => void;
  onResetPermission: () => void;
};

export function CameraPreview({
  videoRef,
  isActive,
  isStarting,
  error,
  canOpenSettings,
  canResetPermission,
  phase,
  score,
  nearDurationMs,
  onStart,
  onOpenSettings,
  onResetPermission,
}: CameraPreviewProps) {
  const scorePercent = Math.round(score * 100);
  const scoreStyle = { "--score-scale": Math.max(0.025, score).toString() } as CSSProperties;

  return (
    <section
      className={`camera-area ${isActive ? "is-live" : ""}`}
      aria-label="Camera preview"
    >
      <video ref={videoRef} className="camera-video" playsInline muted />

      <div className="camera-hud" aria-hidden={!isActive}>
        <span className="live-label">
          <Camera size={16} strokeWidth={1.9} aria-hidden="true" />
          Live camera
        </span>
        <span className={`phase-pill phase-${phase}`}>{formatPhase(phase)}</span>
      </div>

      <div
        className="camera-meter"
        style={scoreStyle}
        aria-label={`Detection score ${scorePercent}%`}
      >
        <span />
      </div>

      <div className="camera-readout" aria-hidden={!isActive}>
        <span>Score {scorePercent}%</span>
        <span>Near mouth {nearDurationMs} ms</span>
      </div>

      {!isActive && (
        <div className="camera-placeholder">
          <VideoOff size={32} strokeWidth={1.7} aria-hidden="true" />
          <p>{isStarting ? "Starting camera..." : "Camera preview is off."}</p>
          {error && <p className="camera-error">{error}</p>}
          <button className="primary-action" type="button" onClick={onStart} disabled={isStarting}>
            <Camera size={17} strokeWidth={1.9} aria-hidden="true" />
            {isStarting ? "Starting" : "Start camera"}
          </button>
          {(canOpenSettings || canResetPermission) && (
            <div className="camera-actions">
              {canResetPermission && (
                <button
                  className="secondary-action"
                  type="button"
                  onClick={onResetPermission}
                  disabled={isStarting}
                >
                  <RotateCcw size={16} strokeWidth={1.9} aria-hidden="true" />
                  Reset permission
                </button>
              )}
              {canOpenSettings && (
                <button className="secondary-action" type="button" onClick={onOpenSettings}>
                  <Settings size={16} strokeWidth={1.9} aria-hidden="true" />
                  Open camera settings
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function formatPhase(phase: string) {
  return phase.replaceAll("_", " ");
}
