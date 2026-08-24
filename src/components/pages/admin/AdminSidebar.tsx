import { NavLink, Link } from "react-router-dom";
import SideNav from "../../common/SideNav/SideNav";
import { useAdminDataContext } from "./AdminDataProvider";
import styles from "./AdminSidebar.module.css";
import navStyles from "../../common/SideNav/SideNav.module.css";
import { useAdminUi } from "./AdminUiContext";
import AdminAddMenu from "./AdminAddMenu";

interface AdminSidebarProps {
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
}

interface NavEntry {
  to: string;
  label: string;
  badge?: number;
  icon: JSX.Element;
}

const icon = (paths: JSX.Element) => (
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
    {paths}
  </svg>
);

function buildEntries(badges: {
  newSubmissions: number;
  newBugs: number;
  brokenLinks: number;
}): NavEntry[] {
  return [
    {
      to: "/admin/analytics",
      label: "Analytics",
      icon: icon(
        <>
          <line x1="4" y1="16" x2="4" y2="10" />
          <line x1="10" y1="16" x2="10" y2="4" />
          <line x1="16" y1="16" x2="16" y2="8" />
        </>
      ),
    },
    {
      to: "/admin/data",
      label: "Data",
      icon: icon(
        <>
          <rect x="3" y="4" width="14" height="12" rx="1" />
          <line x1="3" y1="8" x2="17" y2="8" />
          <line x1="9" y1="8" x2="9" y2="16" />
        </>
      ),
    },
    {
      to: "/admin/submissions",
      label: "Submissions",
      badge: badges.newSubmissions,
      icon: icon(
        <>
          <path d="M4 5h12v10H4z" />
          <path d="M4 6l6 5 6-5" />
        </>
      ),
    },
    {
      to: "/admin/bugs",
      label: "Bugs",
      badge: badges.newBugs,
      icon: icon(
        <>
          <circle cx="10" cy="11" r="4" />
          <path d="M10 7V4M4 11H2m16 0h-2M5 6L4 5m11 1l1-1" />
        </>
      ),
    },
    {
      to: "/admin/broken-links",
      label: "Broken Links",
      badge: badges.brokenLinks,
      icon: icon(
        <>
          <path d="M8 12l4-4" />
          <path d="M7 9L5 11a3 3 0 004 4l1-1" />
          <path d="M13 11l2-2a3 3 0 00-4-4l-1 1" />
        </>
      ),
    },
    {
      to: "/admin/data-builder",
      label: "Data Builder",
      icon: icon(
        <>
          <rect x="3" y="3" width="6" height="6" />
          <rect x="11" y="3" width="6" height="6" />
          <rect x="3" y="11" width="6" height="6" />
          <rect x="11" y="11" width="6" height="6" />
        </>
      ),
    },
  ];
}

function NavItems({
  entries,
  showLabels,
  onNavigate,
}: {
  entries: NavEntry[];
  showLabels: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className={navStyles.navList}>
      {entries.map(entry => (
        <li key={entry.to}>
          <NavLink
            to={entry.to}
            onClick={onNavigate}
            title={showLabels ? undefined : entry.label}
            className={({ isActive }) =>
              `${navStyles.navItem} ${showLabels ? "" : styles.railItem} ${
                isActive ? styles.navItemActive : ""
              }`
            }
          >
            <span className={navStyles.navIcon}>{entry.icon}</span>
            {showLabels && (
              <span className={styles.navLabel}>{entry.label}</span>
            )}
            {showLabels && entry.badge ? (
              <span className={styles.badge}>{entry.badge}</span>
            ) : null}
            {!showLabels && entry.badge ? (
              <span className={styles.railDot} />
            ) : null}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function AdminSidebar({
  isMobile,
  open,
  onClose,
}: AdminSidebarProps) {
  const { badges } = useAdminDataContext();
  const entries = buildEntries(badges);
  const { toggleSidebar } = useAdminUi();

  // Mobile: reuse the shared overlay drawer (same pattern as /map).
  if (isMobile) {
    return (
      <SideNav open={open} onClose={onClose} logoTo="/admin/analytics">
        <NavItems entries={entries} showLabels onNavigate={onClose} />
      </SideNav>
    );
  }

  // Desktop: in-flow push panel — expanded (labels) or collapsed icon rail.
  return (
    <aside
      className={`${styles.aside} ${open ? styles.expanded : styles.rail}`}
    >
      <div className={styles.sideHeader}>
        {open && (
          <Link
            to="/admin/analytics"
            className={styles.logoLink}
            aria-label="Trad Directory admin"
          >
            <img
              src="/TRAD-NEW-SMALL.svg"
              alt="Trad Directory"
              className={styles.logoImg}
            />
          </Link>
        )}
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={toggleSidebar}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title={open ? "Collapse" : "Expand"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? (
              <>
                <polyline points="14 6 8 12 14 18" />
                <line x1="8" y1="12" x2="20" y2="12" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>
      <div className={styles.navScroll}>
        <NavItems entries={entries} showLabels={open} />
      </div>
      <div className={styles.sideFooter}>
        <AdminAddMenu collapsed={!open} />
      </div>
    </aside>
  );
}
