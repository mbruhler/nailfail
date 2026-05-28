import { KeyRound, LogOut } from "lucide-react";

type ExitCodeCardProps = {
  code: string | null;
  onExit: () => void;
};

export function ExitCodeCard({ code, onExit }: ExitCodeCardProps) {
  return (
    <section className="settings-block" aria-label="Exit lock">
      <div className="panel-title-row">
        <div className="panel-title">
          <KeyRound size={18} strokeWidth={1.9} aria-hidden="true" />
          <h2>Exit lock</h2>
        </div>
        <span className="exit-code-chip" aria-label="Your exit code">
          {code ?? "----"}
        </span>
      </div>

      <p>Nailfail keeps running in the menu bar. Keep this code. You need it to quit.</p>

      <button type="button" className="danger-action block-action" onClick={onExit}>
        <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
        Exit Nailfail
      </button>
    </section>
  );
}
