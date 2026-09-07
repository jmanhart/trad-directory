import type { ReactNode } from "react";
import styles from "./IntroModal.module.css";

interface IntroModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  buttonLabel: string;
  children: ReactNode;
}

// Button-only intro dialog (no Escape / backdrop dismiss) — the user must click
// through. Card styling mirrors the admin password modal. Callers decide when
// it opens (every visit, first-visit via localStorage, etc.).
export default function IntroModal({
  open,
  onClose,
  title,
  buttonLabel,
  children,
}: IntroModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-modal-title"
      >
        <h2 id="intro-modal-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <button type="button" className={styles.button} onClick={onClose}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
