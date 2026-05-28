import { useEffect, useRef, useState, type FormEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-react";

type ExitModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ExitModal({ open, onClose }: ExitModalProps) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEntry("");
      setError(null);
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await invoke("attempt_exit", { code: entry.trim() });
      // On success the app quits, so we never get here.
    } catch {
      setError("That code is incorrect. The app stays running.");
      setEntry("");
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="exit-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm exit"
      onClick={onClose}
    >
      <form className="exit-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button type="button" className="exit-modal__close" aria-label="Cancel" onClick={onClose}>
          <X size={18} strokeWidth={1.9} />
        </button>
        <h2 className="exit-modal__title">Enter exit code to quit</h2>
        <p className="exit-modal__body">
          Nailfail keeps running in the menu bar. Type the code shown on the Settings page to close
          it completely.
        </p>
        <input
          ref={inputRef}
          className="exit-modal__input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000"
          value={entry}
          onChange={(event) => {
            setEntry(event.target.value);
            setError(null);
          }}
        />
        {error && <p className="exit-modal__error">{error}</p>}
        <div className="exit-modal__actions">
          <button type="button" onClick={onClose}>
            Keep running
          </button>
          <button type="submit" className="exit-modal__confirm" disabled={!entry.trim()}>
            Quit Nailfail
          </button>
        </div>
      </form>
    </div>
  );
}
