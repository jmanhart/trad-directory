import { useEffect } from "react";
import styles from "./StoreIntroModal.module.css";

interface StoreIntroModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StoreIntroModal({
  open,
  onClose,
}: StoreIntroModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-intro-title"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="store-intro-title" className={styles.title}>
          I&rsquo;m just the hype man
        </h2>
        <p className={styles.body}>
          I don&rsquo;t make a dime off this, and none of this work is mine.
          It&rsquo;s just a jumping-off point to buy straight from the artist
          &mdash; no tracking links, no data grabbing, none of that bullshit.
        </p>
        <button type="button" className={styles.button} onClick={onClose}>
          Hell Yeah
        </button>
      </div>
    </div>
  );
}
