import React, { useState, useEffect } from "react";
import { fetchTattooShopsWithArtists } from "../../services/api";
import SearchBar from "../common/SearchBar";
import ResultsSection from "../results/ResultsSection";
import HeroMessage from "../common/HeroMessage";
import styles from "./HomePage.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
  shop_name?: string;
  shop_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

const MainApp: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredResults, setFilteredResults] = useState<Artist[]>([]);
  const [suggestions, setSuggestions] = useState<
    { label: string; type: "artist" | "shop" | "location"; detail?: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function getData() {
      try {
        const data = await fetchTattooShopsWithArtists();
        if (data) {
          setArtists(data);

          // Generate deduplicated suggestions with Instagram handles
          const artistSuggestions = Array.from(
            new Set(data.map((artist) => artist.name))
          ).map((name) => {
            const artist = data.find((artist) => artist.name === name);
            return {
              label: name,
              type: "artist" as const,
              detail: artist?.instagram_handle
                ? `@${artist.instagram_handle}`
                : "",
            };
          });

          const shopSuggestions = Array.from(
            new Set(
              data
                .filter(
                  (artist) => artist.shop_name && artist.shop_name !== "N/A"
                )
                .map((artist) => artist.shop_name!)
            )
          ).map((name) => ({ label: name, type: "shop" as const }));

          const locationSuggestions = Array.from(
            new Set(
              data.flatMap((artist) => [
                artist.city_name,
                artist.state_name,
                artist.country_name,
              ])
            )
          )
            .filter(Boolean)
            .map((location) => ({
              label: location!,
              type: "location" as const,
            }));

          setSuggestions([
            ...artistSuggestions,
            ...shopSuggestions,
            ...locationSuggestions,
          ]);
        }
      } catch (error: unknown) {
        setError("Error fetching data.");
        console.error("Fetch error:", error);
      }
    }

    getData();
  }, []);

  const handleSearch = (query: string) => {
    if (!artists.length) return;
    const normalizedQuery = query.toLowerCase().replace(/^@/, "");
    const filtered = artists.filter(
      (artist) =>
        artist.name?.toLowerCase().includes(normalizedQuery) ||
        artist.instagram_handle?.toLowerCase().includes(normalizedQuery) ||
        artist.shop_name?.toLowerCase().includes(normalizedQuery) ||
        artist.city_name?.toLowerCase().includes(normalizedQuery) ||
        artist.state_name?.toLowerCase().includes(normalizedQuery) ||
        artist.country_name?.toLowerCase().includes(normalizedQuery)
    );
    // Always sort A-Z
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    setFilteredResults(sorted);
    setHasSearched(true);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trad Tattoo Directory</h1>

      <HeroMessage />
      <SearchBar onSearch={handleSearch} suggestions={suggestions} />

      {error && <p className={styles.error}>{error}</p>}

      {hasSearched && filteredResults.length > 0 && (
        <p className={styles.searchResultsMessage}>
          {filteredResults.length} result
          {filteredResults.length !== 1 ? "s" : ""} found
        </p>
      )}

      {hasSearched && filteredResults.length === 0 && (
        <p className={styles.noResults}>No results found. Please try again.</p>
      )}

      <ResultsSection artists={filteredResults} hasSearched={hasSearched} />
    </div>
  );
};

export default MainApp;
