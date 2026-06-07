import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./MapSidebar.module.css";

interface MapSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MapSidebar({ open, onClose }: MapSidebarProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <div className={`${styles.wrapper} ${open ? styles.wrapperOpen : ""}`}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <Link to="/" className={styles.headerLogo}>
            <img src="/TRAD-NEW-SMALL.svg" alt="TRAD" />
          </Link>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>
        <nav className={styles.content}>
          <ul className={styles.navList}>
            <li>
              <Link to="/suggest" className={styles.navItem} onClick={onClose}>
                <span className={styles.navIcon}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="10" cy="10" r="8" />
                    <line x1="10" y1="6" x2="10" y2="14" />
                    <line x1="6" y1="10" x2="14" y2="10" />
                  </svg>
                </span>
                Add an Artist or Shop
              </Link>
            </li>
            <li>
              <Link to="/admin" className={styles.navItem} onClick={onClose}>
                <span className={styles.navIcon}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="14" height="14" rx="2" />
                    <line x1="3" y1="8" x2="17" y2="8" />
                    <line x1="8" y1="8" x2="8" y2="17" />
                  </svg>
                </span>
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
