import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./TopAppBar.module.css";
import SearchBar from "./SearchBar";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import { createSearchHandler } from "../../utils/navigation";

export default function TopAppBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const { suggestions } = useSearchSuggestions();
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
      </div>
      <div className={styles.center}>
        {!isHomePage && (
          <SearchBar
            size="compact"
            onSearch={handleSearch}
            suggestions={suggestions}
            placeholder="Search"
          />
        )}
      </div>
      <div className={styles.right} aria-hidden="true" />
    </header>
  );
}
