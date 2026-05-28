import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

/**
 * Fullscreen punishment overlay shown in its own always-on-top window when
 * biting is confirmed. Dismissible by click or any key — it interrupts hard
 * but never traps the user.
 */
export function BlockOverlay() {
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const dismiss = () => {
      setDismissing(true);
      void invoke("dismiss_block_screen").catch(() => undefined);
    };

    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", dismiss);

    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, []);

  return (
    <div className="block-overlay" role="alertdialog" aria-label="Stop biting your nails">
      <p className="block-overlay__eyebrow">Nailfail</p>
      <h1 className="block-overlay__title">STOP BITING YOUR NAILS</h1>
      <p className="block-overlay__hint">
        {dismissing ? "Releasing…" : "Click anywhere or press any key to dismiss"}
      </p>
    </div>
  );
}
