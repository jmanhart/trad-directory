import React, { useState, useEffect } from "react";
import { fetchTattooShopsWithArtists } from "../services/api";
import SearchBar from "./SearchBar";
import HeroMessage from "./HeroMessage";
import ArtistList from "./ArtistList";
import styles from "./MainApp.module.css";

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
    { label: string; type: "artist" | "shop" | "location" }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getData() {
      try {
        const data = await fetchTattooShopsWithArtists();
        if (data) {
          console.log("Initial artists:", data);

          setArtists(data);
          setFilteredResults(data);

          // Deduplicate suggestions
          const artistSuggestions = Array.from(
            new Set(data.map((artist) => artist.name))
          ).map((name) => ({ label: name, type: "artist" }));

          const shopSuggestions = Array.from(
            new Set(
              data
                .filter(
                  (artist) => artist.shop_name && artist.shop_name !== "N/A"
                )
                .map((artist) => artist.shop_name!)
            )
          ).map((name) => ({ label: name, type: "shop" }));

          const locationSuggestions = Array.from(
            new Set(
              data.flatMap((artist) => [
                artist.city_name,
                artist.state_name,
                artist.country_name,
              ])
            )
          )
            .filter(Boolean) // Remove null/undefined values
            .map((location) => ({ label: location!, type: "location" }));

          setSuggestions([
            ...artistSuggestions,
            ...shopSuggestions,
            ...locationSuggestions,
          ]);
        }
      } catch (error: any) {
        setError("Error fetching data.");
        console.error("Fetch error:", error);
      }
    }

    getData();
  }, []);

  const handleSearch = (query: string) => {
    console.log("Search query:", query);

    if (!artists.length) return;

    const lowerCaseQuery = query.toLowerCase();
    const filtered = artists.filter(
      (artist) =>
        artist.name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.shop_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.city_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.state_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.country_name?.toLowerCase().includes(lowerCaseQuery)
    );

    console.log("Filtered results:", filtered);
    setFilteredResults(filtered);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tattoo Artist & Shop Directory</h1>
      <HeroMessage />
      {error && <p className={styles.error}>{error}</p>}
      <SearchBar onSearch={handleSearch} suggestions={suggestions} />

      {filteredResults.length > 0 ? (
        <ArtistList artists={filteredResults} />
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
};

export default MainApp;
