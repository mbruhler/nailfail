import { LoaderCircle, Play, Square } from "lucide-react";

type ControlRowProps = {
  isActive: boolean;
  isStarting: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function ControlRow({ isActive, isStarting, onStart, onStop }: ControlRowProps) {
  const actionLabel = isStarting ? "Starting camera" : isActive ? "Stop camera" : "Start camera";
  const ActionIcon = isStarting ? LoaderCircle : isActive ? Square : Play;

  return (
    <button
      className={`primary-action block-action ${isActive ? "is-stop" : ""}`}
      type="button"
      onClick={isActive ? onStop : onStart}
      disabled={isStarting}
    >
      <ActionIcon
        className={isStarting ? "spin-icon" : ""}
        size={18}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>{actionLabel}</span>
    </button>
  );
}
