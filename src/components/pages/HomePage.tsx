import { useNavigate } from "react-router-dom";
import { useHomePageData } from "../../hooks/useHomePageData";
import { createSearchHandler } from "../../utils/navigation";
import { type Suggestion } from "../../utils/suggestions";
import { trackSearch } from "../../utils/analytics";
import SearchBar from "../common/SearchBar";
import HeroMessageText from "../common/HeroMessageText";
import styles from "./HomePage.module.css";
import RecentlyAdded from "../recent/RecentlyAdded";

export default function HomePage() {
  const navigate = useNavigate();
  const { suggestions, error, loading } = useHomePageData();

  const baseSearchHandler = createSearchHandler(navigate);
  const handleSearch = (query: string) => {
    trackSearch({
      search_term: query,
      search_location: "home",
    });
    baseSearchHandler(query);
  };

  const handleSelectSuggestion = async (s: Suggestion) => {
    if (s.type === "artist" && s.id) {
      // Fetch artist to get slug for human-readable URL
      try {
        const response = await fetch(`/api/artists/${s.id}`);
        if (response.ok) {
          const data = await response.json();
          const slug = data.result?.slug;
          if (slug) {
            navigate(`/artist/${slug}`, {
              state: { fromSearch: true, previous: "/?from=home" },
            });
            return;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch artist slug, using ID:", error);
      }
      // Fallback to ID if slug fetch fails
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
                src="/TRAD-NEW.svg"
                alt="TRAD DIRECTORY"
                className={styles.logoSvg}
              />
              <img
                src="/DIRECTORY-NEW.svg"
                alt="TRAD DIRECTORY"
                className={styles.logoSvg}
              />
            </div>
            <HeroMessageText />
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
