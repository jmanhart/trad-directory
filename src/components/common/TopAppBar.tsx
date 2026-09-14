import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./TopAppBar.module.css";
import SearchBar from "./SearchBar";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import { createSearchHandler } from "../../utils/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { flags } from "../../lib/flags";

export default function TopAppBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isStorePage = location.pathname === "/store";
  const { suggestions } = useSearchSuggestions();
  const { user } = useAuth();
  const handleSearch = createSearchHandler(navigate);

  return (
    <header
      className={`${styles.topAppBar} ${!isHomePage ? styles.withBorder : ""}`}
    >
      <div className={styles.left}>
        {!isHomePage && (
          <Link to="/" className={styles.logoContainer}>
            <img src="/TRAD-NEW-SMALL.svg" alt="TRAD" className={styles.logo} />
          </Link>
        )}
        {isStorePage && <span className={styles.pageTitle}>Store</span>}
      </div>
      <div className={styles.center}>
        {!isHomePage && !isStorePage && (
          <SearchBar
            size="compact"
            onSearch={handleSearch}
            suggestions={suggestions}
          />
        )}
      </div>
      <div className={styles.right}>
        {flags.accounts && (
          <nav className={styles.authNav}>
            {user ? (
              <>
                <Link to="/saved" className={styles.authLink}>
                  Saved
                </Link>
                <Link to="/account" className={styles.authLink}>
                  Account
                </Link>
              </>
            ) : (
              <Link to="/login" className={styles.authLink}>
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
