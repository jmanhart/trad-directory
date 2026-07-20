import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./SideNav.module.css";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
  logoTo?: string;
  logoSrc?: string;
  logoAlt?: string;
  children: ReactNode;
}

/**
 * Shared slide-in overlay drawer shell (backdrop + panel + Esc-to-close).
 * Used by the map sidebar and the admin sidebar. Pass nav content as children,
 * typically via SideNavList / SideNavItem below.
 */
export default function SideNav({
  open,
  onClose,
  logoTo = "/",
  logoSrc = "/TRAD-NEW-SMALL.svg",
  logoAlt = "TRAD",
  children,
}: SideNavProps) {
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
          <Link to={logoTo} className={styles.headerLogo}>
            <img src={logoSrc} alt={logoAlt} />
          </Link>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>
        <nav className={styles.content}>{children}</nav>
      </div>
    </div>
  );
}

export function SideNavList({ children }: { children: ReactNode }) {
  return <ul className={styles.navList}>{children}</ul>;
}

interface SideNavItemProps {
  /** If set, renders a router Link; otherwise a button. */
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}

export function SideNavItem({ to, onClick, icon, children }: SideNavItemProps) {
  const inner = (
    <>
      {icon && <span className={styles.navIcon}>{icon}</span>}
      {children}
    </>
  );
  return (
    <li>
      {to ? (
        <Link to={to} className={styles.navItem} onClick={onClick}>
          {inner}
        </Link>
      ) : (
        <button type="button" className={styles.navItem} onClick={onClick}>
          {inner}
        </button>
      )}
    </li>
  );
}
