import { useNavigate } from "react-router-dom";
import { useHomePageData } from "../../hooks/useHomePageData";
import { createSearchHandler } from "../../utils/navigation";
import { type Suggestion } from "../../utils/suggestions";
import SearchBar from "../common/SearchBar";
import HeroMessage from "../common/HeroMessage";
import styles from "./HomePage.module.css";
import RecentlyAdded from "../recent/RecentlyAdded";

export default function HomePage() {
  const navigate = useNavigate();
  const { suggestions, error, loading } = useHomePageData();

  const handleSearch = createSearchHandler(navigate);

  const handleSelectSuggestion = (s: Suggestion) => {
    if (s.type === "artist" && s.id) {
      navigate(`/artist/${s.id}`, {
        state: { fromSearch: true, previous: "/?from=home" },
      });
      return;
    }
    handleSearch(s.label);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h2 className={styles.logo}>Trad Directory</h2>
            <HeroMessage />
          </div>
          <SearchBar
            onSearch={handleSearch}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            size="large"
          />
          <div className={styles.recentSection}>
            <RecentlyAdded limit={5} />
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
