import { ArrowLeft, Settings, ShieldCheck } from "lucide-react";

type View = "monitor" | "settings";

type AppHeaderProps = {
  view: View;
  onOpenSettings: () => void;
  onBack: () => void;
};

export function AppHeader({ view, onOpenSettings, onBack }: AppHeaderProps) {
  if (view === "settings") {
    return (
      <header className="app-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Back to monitor"
          onClick={onBack}
        >
          <ArrowLeft size={18} strokeWidth={1.9} />
        </button>
        <h1 className="app-title">Settings</h1>
        <span className="icon-button-spacer" aria-hidden="true" />
      </header>
    );
  }

  return (
    <header className="app-header">
      <span className="brand-mark" aria-hidden="true">
        <ShieldCheck size={18} strokeWidth={1.9} />
      </span>
      <div className="brand-text">
        <p className="app-kicker">Habit monitor</p>
        <h1 className="app-title">Nailfail</h1>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label="Open settings"
        onClick={onOpenSettings}
      >
        <Settings size={18} strokeWidth={1.9} />
      </button>
    </header>
  );
}
