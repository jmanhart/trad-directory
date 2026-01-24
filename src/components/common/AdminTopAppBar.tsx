import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./AdminTopAppBar.module.css";

export default function AdminTopAppBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      <Link to="/admin" className={styles.logoContainer}>
        <img 
          src="/TRAD-3.svg" 
          alt="TRAD" 
          className={styles.logo}
        />
        <img 
          src="/DIRECTORY-3.svg" 
          alt="DIRECTORY" 
          className={styles.logo}
        />
      </Link>
      
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
