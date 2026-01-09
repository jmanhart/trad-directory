import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext";
import SearchIcon from "../../assets/icons/searchIcon";
import ArtistsIcon from "../../assets/icons/artistsIcon";
import ShopsIcon from "../../assets/icons/shopsIcon";
import AboutIcon from "../../assets/icons/aboutIcon";
import InstagramIcon from "../../assets/icons/instagramIcon";
import styles from "./Sidebar.module.css";

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

const Sidebar: React.FC = () => {
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

  // Mobile menu items (Search, Artists, Shops, About)
  const mobileMenuItems: SidebarItem[] = [
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
      label: "Shops",
      icon: <ShopsIcon />,
    },
    {
      path: "/about",
      label: "About",
      icon: <AboutIcon />,
    },
  ];

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
      <aside className={`${styles.sidebar} ${isExpanded ? styles.expanded : styles.collapsed}`}>
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
              <span className={styles.label}>Trad Directory</span>
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
};

export default Sidebar;

