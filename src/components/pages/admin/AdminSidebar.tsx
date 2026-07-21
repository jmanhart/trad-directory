import { NavLink } from "react-router-dom";
import SideNav from "../../common/SideNav/SideNav";
import { useAdminDataContext } from "./AdminDataProvider";
import styles from "./AdminSidebar.module.css";
import navStyles from "../../common/SideNav/SideNav.module.css";

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
      label: "All Analytics",
      icon: icon(
        <>
          <line x1="4" y1="16" x2="4" y2="10" />
          <line x1="10" y1="16" x2="10" y2="4" />
          <line x1="16" y1="16" x2="16" y2="8" />
        </>
      ),
    },
    {
      to: "/admin/artists",
      label: "All Artists",
      icon: icon(
        <>
          <circle cx="10" cy="7" r="3" />
          <path d="M4 17c0-3 3-5 6-5s6 2 6 5" />
        </>
      ),
    },
    {
      to: "/admin/shops",
      label: "All Shops",
      icon: icon(
        <>
          <path d="M3 8l1-4h12l1 4" />
          <path d="M4 8v8h12V8" />
        </>
      ),
    },
    {
      to: "/admin/cities",
      label: "All Cities",
      icon: icon(
        <>
          <rect x="4" y="8" width="4" height="9" />
          <rect x="12" y="5" width="4" height="12" />
        </>
      ),
    },
    {
      to: "/admin/countries",
      label: "All Countries",
      icon: icon(
        <>
          <circle cx="10" cy="10" r="7" />
          <path d="M3 10h14M10 3a12 12 0 010 14M10 3a12 12 0 000 14" />
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
      <NavItems entries={entries} showLabels={open} />
    </aside>
  );
}
