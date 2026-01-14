import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext";
import SearchIcon from "../../assets/icons/searchIcon";
import ArtistsIcon from "../../assets/icons/artistsIcon";
import ShopsIcon from "../../assets/icons/shopsIcon";
import AboutIcon from "../../assets/icons/aboutIcon";
import InstagramIcon from "../../assets/icons/instagramIcon";
import SidebarLogo from "./SidebarLogo";
import styles from "./Sidebar.module.css";

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const mainMenuItems: SidebarItem[] = [
    {
      path: "/",
      label: "Search",
      icon: <SearchIcon />,
    },
    {
      path: "/artists",
      label: "Artists",
      icon: <ArtistsIcon />,
    },
    {
      path: "/shops",
      label: "Tattoo Shops",
      icon: <ShopsIcon />,
    },
  ];

  const bottomMenuItems: SidebarItem[] = [
    {
      path: "/about",
      label: "About",
      icon: <AboutIcon />,
    },
    {
      path: "https://www.instagram.com/trad_tattoo_directory/",
      label: "Instagram",
      icon: <InstagramIcon />,
      external: true,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Mobile bottom app bar items (Search, Artists, Shops only)
  const mobileMenuItems: SidebarItem[] = [
    {
      path: "/",
      label: "Search",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      ),
    },
    {
      path: "/artists",
      label: "Artists",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      path: "/shops",
      label: "Shops",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  const renderNavItem = (item: SidebarItem) => {
    const active = isActive(item.path);
    const content = (
      <>
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.label}>{item.label}</span>
      </>
    );

    if (item.external) {
      return (
        <a
          key={item.path}
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.navItem} ${active ? styles.active : ""}`}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`${styles.navItem} ${active ? styles.active : ""}`}
      >
        {content}
      </Link>
    );
  };

  const renderMobileNavItem = (item: SidebarItem) => {
    const active = isActive(item.path);
    const content = (
      <div className={`${styles.mobileNavItem} ${active ? styles.mobileActive : ""}`}>
        <span className={styles.mobileIcon}>{item.icon}</span>
        <span className={styles.mobileLabel}>{item.label}</span>
      </div>
    );

    if (item.external) {
      return (
        <a
          key={item.path}
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mobileNavLink}
        >
          {content}
        </a>
      );
    }

    return (
      <Link key={item.path} to={item.path} className={styles.mobileNavLink}>
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${styles.sidebar} ${isExpanded ? styles.expanded : styles.collapsed}`}
      >
        <div className={styles.navContainer}>
          <nav className={styles.nav}>
            <div
              className={styles.navItem}
              onClick={() => {
                setIsExpanded(!isExpanded);
                // Navigate to home if not already there
                if (location.pathname !== "/") {
                  navigate("/");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <span className={styles.icon}>
                <img
                  src="/logo.jpg"
                  alt="Trad Directory"
                  className={styles.logoIcon}
                />
              </span>
              {isExpanded && <span className={styles.label}>Trad Directory</span>}
            </div>
            {mainMenuItems.map(renderNavItem)}
          </nav>
          <nav className={styles.bottomNav}>
            {bottomMenuItems.map(renderNavItem)}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileBottomNav}>
        {mobileMenuItems.map(renderMobileNavItem)}
      </nav>
    </>
  );
}
