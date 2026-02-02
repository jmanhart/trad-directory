import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const INSTAGRAM_URL = "https://www.instagram.com/trad_tattoo_directory/";

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <nav className={styles.nav} aria-label="Footer">
        <Link to="/about" className={styles.link}>
          About
        </Link>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Instagram
        </a>
      </nav>
    </footer>
  );
}
