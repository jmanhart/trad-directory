import React from "react";
import { useNavigate } from "react-router-dom";
import { useHomePageData } from "../../hooks/useHomePageData";
import { createSearchHandler, createPillClickHandler } from "../../utils/navigation";
import { type Suggestion } from "../../utils/suggestions";
import SearchBar from "../common/SearchBar";
import HeroMessage from "../common/HeroMessage";
import styles from "./HomePage.module.css";
import PillGroup from "../common/PillGroup";
import RecentArtists from "../recent/RecentArtists";
import RecentShops from "../recent/RecentShops";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_id?: number | null;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}

interface Suggestion {
  label: string;
  type: "artist" | "shop" | "location";
  detail?: string;
  id?: number;
}

const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const { suggestions, topCities, topCountries, error, loading } =
    useHomePageData();

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
      <h1 className={styles.title}>Trad Tattoo Directory</h1>

      <HeroMessage />
      <SearchBar
        onSearch={handleSearch}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
      />


      {topCities.length > 0 && (
        <div className={styles.section}>
          <PillGroup
            title="Top Cities"
            items={topCities.map((c) => ({
              label: c.city_name,
              count: c.count,
              onClick: createPillClickHandler(navigate, c.city_name),
            }))}
          />
        </div>
      )}

      {topCountries.length > 0 && (
        <div className={styles.section}>
          <PillGroup
            title="Top Countries"
            items={topCountries.map((c) => ({
              label: c.country_name,
              count: c.count,
              onClick: createPillClickHandler(navigate, c.country_name),
            }))}
          />
        </div>
      )}

        <RecentArtists limit={3} />
        <RecentShops limit={3} />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default MainApp;
