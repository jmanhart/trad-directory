import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

interface FooterProps {
  onOpenSuggestModal?: () => void;
}

export default function Footer({ onOpenSuggestModal }: FooterProps) {
  return (
    <footer className={styles.footer} role="contentinfo">
      <nav className={styles.nav} aria-label="Footer">
        {onOpenSuggestModal && (
          <button
            type="button"
            className={styles.linkButton}
            onClick={onOpenSuggestModal}
          >
            Suggest an Artist
          </button>
        )}
        <Link to="/about" className={styles.link}>
          About
        </Link>
      </nav>
    </footer>
  );
}
