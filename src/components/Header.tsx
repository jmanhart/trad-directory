import React from "react";
import { Link } from "react-router-dom";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">Trad Tattoo Directory</Link>
      </div>
      <nav className={styles.nav}>
        <Link to="/shops" className={styles.navLink}>
          All Shops
        </Link>
        <Link to="/about" className={styles.navLink}>
          About
        </Link>
        {/* <Link to="/contact" className={styles.navLink}>
          Contact
        </Link>
        <a
          href="https://github.com/your-repo-link"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          GitHub
        </a> */}
        <a
          href="https://www.instagram.com/trad_tattoo_directory/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          Instagram
        </a>
      </nav>
    </header>
  );
};

export default Header;
