import { ReactNode } from "react";
import styles from "./AdminDetailPanel.module.css";

interface AdminDetailPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Field content — read-only view or the edit form. */
  children: ReactNode;
  /** Sticky action bar at the bottom (Edit, or Delete/Cancel/Save). */
  footer?: ReactNode;
  /** Force the fixed right-side overlay (with backdrop) regardless of viewport. */
  overlay?: boolean;
}

/**
 * Right-side detail/edit flyout. On desktop it sits in the flex row and pushes
 * the table narrower; below 900px it becomes an overlay with a backdrop.
 */
export default function AdminDetailPanel({
  open,
  title,
  onClose,
  children,
  footer,
  overlay = false,
}: AdminDetailPanelProps) {
  if (!open) return null;
  return (
    <>
      <div
        className={`${styles.backdrop} ${overlay ? styles.backdropOverlay : ""}`}
        onClick={onClose}
      />
      <aside
        className={`${styles.panel} ${overlay ? styles.panelOverlay : ""}`}
        aria-label={title}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </>
  );
}
