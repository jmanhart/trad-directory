import React from "react";
import { Link } from "react-router-dom";
import styles from "./TopAppBar.module.css";

export default function TopAppBar() {
  return (
    <header className={styles.topAppBar}>
      <Link to="/" className={styles.logoContainer}>
        <img 
          src="/TD-LOGO.svg" 
          alt="Logo" 
          className={styles.logo}
        />
      </Link>
      <nav className={styles.nav}>
        <Link to="/about" className={styles.navLink}>
          About
        </Link>
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
}
