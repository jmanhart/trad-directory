import React from "react";
import styles from "./ModalShell.module.css";

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  hideHeader?: boolean;
  children: React.ReactNode;
}

export default function ModalShell({
  isOpen,
  onClose,
  title = "",
  hideHeader = false,
  children,
}: ModalShellProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {!hideHeader && (
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{title}</h2>
            <button
              type="button"
              className={styles.modalClose}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className={styles.modalContent}>{children}</div>
      </div>
    </div>
  );
}
