import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminUi } from "../pages/admin/AdminUiContext";
import styles from "./AdminTopAppBar.module.css";

export default function AdminTopAppBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toggleSidebar } = useAdminUi();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAddClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <header className={styles.adminTopAppBar}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={toggleSidebar}
          aria-label="Toggle admin menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <Link to="/admin" className={styles.logoContainer}>
          <img src="/TRAD-3.svg" alt="TRAD" className={styles.logo} />
          <img src="/DIRECTORY-3.svg" alt="DIRECTORY" className={styles.logo} />
        </Link>
      </div>
      
      <div className={styles.rightSection} ref={dropdownRef}>
        <button 
          className={styles.addButton}
          onClick={handleAddClick}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <span className={styles.plusIcon}>+</span>
          <span>Add Item</span>
        </button>
        
        {isDropdownOpen && (
          <div className={styles.dropdown}>
            <button
              className={styles.dropdownItem}
              onClick={() => handleMenuItemClick("/admin/add-artist")}
            >
              Artist
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleMenuItemClick("/admin/add-country")}
            >
              Country
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleMenuItemClick("/admin/add-city")}
            >
              City
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleMenuItemClick("/admin/add-shop")}
            >
              Tattoo Shop
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
