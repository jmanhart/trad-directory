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
            <img src="/TRAD-3.svg" alt="TRAD" className={styles.logo} />
            <img
              src="/DIRECTORY-3.svg"
              alt="DIRECTORY"
              className={styles.logo}
            />
          </Link>
        )}
      </div>
      <div className={styles.right}>
        {!isHomePage && (
          <SearchBar
            size="compact"
            onSearch={handleSearch}
            suggestions={suggestions}
            placeholder="Search"
          />
        )}
      </div>
    </header>
  );
}
