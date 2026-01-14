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
      <HeroMessage />
      <SearchBar
        onSearch={handleSearch}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
      />

      <RecentlyAdded limit={10} />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
