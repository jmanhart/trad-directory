import { Link, useLocation } from "react-router-dom";
import styles from "./TopAppBar.module.css";
import InstagramIcon from "../../assets/icons/instagramIcon";

export default function TopAppBar() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className={styles.topAppBar}>
      <div className={styles.spacer}></div>
      {!isHomePage && (
        <Link to="/" className={styles.logoContainer}>
          <img 
            src="/FULL-LOGO.svg" 
            alt="TRAD" 
            className={styles.logo}
          />
        </Link>
      )}
      <nav className={styles.nav}>
        <Link to="/about" className={styles.navLink}>
          About
        </Link>
        <a
          href="https://www.instagram.com/trad_tattoo_directory/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
          aria-label="Instagram"
        >
          <InstagramIcon className={styles.instagramIcon} />
        </a>
      </nav>
    </header>
  );
}
