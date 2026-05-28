import { ShieldCheck } from "lucide-react";

export function PrivacyNote() {
  return (
    <section className="privacy-note" aria-label="Privacy boundary">
      <div className="panel-title">
        <ShieldCheck size={18} strokeWidth={1.9} aria-hidden="true" />
        <h2>Privacy boundary</h2>
      </div>
      <p>No video, snapshots, or raw camera frames are saved. Everything runs locally and nothing is stored.</p>
    </section>
  );
}
