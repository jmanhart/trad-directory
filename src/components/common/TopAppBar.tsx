import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./TopAppBar.module.css";
import InstagramIcon from "../../assets/icons/instagramIcon";
import ReportIssueModal from "./ReportIssueModal";
import SearchBar from "./SearchBar";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import { createSearchHandler } from "../../utils/navigation";

export default function TopAppBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const [isAddArtistModalOpen, setIsAddArtistModalOpen] = useState(false);
  const { suggestions } = useSearchSuggestions();
  const handleSearch = createSearchHandler(navigate);

  return (
    <>
      <header
        className={`${styles.topAppBar} ${!isHomePage ? styles.withBorder : ""}`}
      >
        <div className={styles.left}>
          {!isHomePage && (
            <Link to="/" className={styles.logoContainer}>
              <img src="/TRAD-3.svg" alt="TRAD" className={styles.logo} />
              <img
                src="/DIRECTORY-3.svg"
                alt="DIRECTORY"
                className={styles.logo}
              />
            </Link>
          )}
        </div>
        <div className={styles.center}>
          <SearchBar
            size="compact"
            onSearch={handleSearch}
            suggestions={suggestions}
            placeholder="Search artists, shops, locations..."
          />
        </div>
        <div className={styles.spacer} aria-hidden />
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

      <ReportIssueModal
        isOpen={isAddArtistModalOpen}
        onClose={() => setIsAddArtistModalOpen(false)}
        mode="new_artist"
      />
    </>
  );
}
