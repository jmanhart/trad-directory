import { useNavigate } from "react-router-dom";
import { useHomePageData } from "../../hooks/useHomePageData";
import { createSearchHandler } from "../../utils/navigation";
import { type Suggestion } from "../../utils/suggestions";
import { trackSearch } from "../../utils/analytics";
import SearchBar from "../common/SearchBar";
import HeroMessage from "../common/HeroMessage";
import styles from "./HomePage.module.css";
import RecentlyAdded from "../recent/RecentlyAdded";

export default function HomePage() {
  const navigate = useNavigate();
  const { suggestions, error, loading } = useHomePageData();

  const baseSearchHandler = createSearchHandler(navigate);
  const handleSearch = (query: string) => {
    trackSearch({
      search_term: query,
      search_location: 'home',
    });
    baseSearchHandler(query);
  };

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
            <div className={styles.logo}>
              <img 
                src="/TRAD-3.svg" 
                alt="TRAD DIRECTORY" 
                className={styles.logoSvg}
              />
                            <img 
                src="/DIRECTORY-3.svg" 
                alt="TRAD DIRECTORY" 
                className={styles.logoSvg}
              />
            </div>
            <HeroMessage />
          </div>
          <SearchBar
              onSearch={handleSearch}
              suggestions={suggestions}
              onSelectSuggestion={handleSelectSuggestion}
              size="large"
              debug={false}
            />

          <div className={styles.recentSection}>
            <RecentlyAdded limit={30} includeLocations={true} />
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
