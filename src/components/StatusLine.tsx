import { Activity, Bell, Camera, Clock3, Gauge, ScanFace } from "lucide-react";

type StatusLineProps = {
  cameraActive: boolean;
  cameraStarting: boolean;
  cameraError: string | null;
  monitorPhase: string;
  monitorError: string | null;
  score: number;
  nearDurationMs: number;
  lastAlertAt: number | null;
  alertsEnabled: boolean;
};

export function StatusLine({
  cameraActive,
  cameraStarting,
  cameraError,
  monitorPhase,
  monitorError,
  score,
  nearDurationMs,
  lastAlertAt,
  alertsEnabled,
}: StatusLineProps) {
  const cameraStatus = cameraError
    ? `Camera error: ${cameraError}`
    : cameraStarting
      ? "Camera starting"
      : cameraActive
        ? "Camera on"
        : "Camera off";
  const monitorStatus = monitorError ? `Detector error: ${monitorError}` : monitorPhase;
  const alertStatus = alertsEnabled ? "alerts on" : "alerts off";
  const alertTime = lastAlertAt ? new Date(lastAlertAt).toLocaleTimeString() : "No alert yet";
  const scorePercent = `${Math.round(score * 100)}%`;

  return (
    <section className="status-board" aria-label="System status">
      <div className="panel-title">
        <Activity size={18} strokeWidth={1.9} aria-hidden="true" />
        <h2>Live state</h2>
      </div>

      <div className="status-grid">
        <StatusTile
          Icon={Camera}
          label="Camera"
          value={cameraStatus}
          tone={cameraError ? "bad" : cameraActive ? "good" : "idle"}
        />
        <StatusTile
          Icon={ScanFace}
          label="Detector"
          value={formatPhase(monitorStatus)}
          tone={
            monitorError
              ? "bad"
              : monitorPhase === "confirmed_biting"
                ? "alert"
                : monitorPhase === "suspected_biting"
                  ? "warn"
                  : "good"
          }
        />
        <StatusTile
          Icon={Gauge}
          label="Score"
          value={scorePercent}
          tone={score > 0.66 ? "alert" : score > 0.33 ? "warn" : "idle"}
        />
        <StatusTile
          Icon={Clock3}
          label="Near mouth"
          value={`${nearDurationMs} ms`}
          tone={nearDurationMs > 800 ? "warn" : "idle"}
        />
        <StatusTile
          Icon={Bell}
          label="Alerts"
          value={alertStatus}
          tone={alertsEnabled ? "good" : "idle"}
        />
        <StatusTile
          Icon={Clock3}
          label="Last alert"
          value={alertTime}
          tone={lastAlertAt ? "warn" : "idle"}
        />
      </div>
    </section>
  );
}

type StatusTone = "good" | "warn" | "alert" | "bad" | "idle";
type StatusTileProps = {
  Icon: typeof Activity;
  label: string;
  value: string;
  tone: StatusTone;
};

function StatusTile({ Icon, label, value, tone }: StatusTileProps) {
  return (
    <div className={`status-tile tone-${tone}`}>
      <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatPhase(value: string) {
  return value.replaceAll("_", " ");
}
