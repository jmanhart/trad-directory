import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTattooShopsWithArtists } from "../../services/api";
import SearchBar from "../common/SearchBar";
import HeroMessage from "../common/HeroMessage";
import styles from "./HomePage.module.css";

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getData() {
      try {
        const data = (await fetchTattooShopsWithArtists()) as Artist[];
        if (data) {
          // Artist suggestions with unique ids
          const uniqueIds = Array.from(new Set(data.map((a) => a.id)));
          const artistSuggestions: Suggestion[] = uniqueIds.map((id) => {
            const artist = data.find((a) => a.id === id)!;
            return {
              label: artist.name,
              type: "artist" as const,
              detail: artist?.instagram_handle
                ? `@${artist.instagram_handle}`
                : "",
              id: artist.id,
            };
          });

          const uniqueShops = Array.from(
            new Set(
              data
                .filter(
                  (artist) => artist.shop_name && artist.shop_name !== "N/A"
                )
                .map((artist) => artist.shop_name as string)
            )
          );
          const shopSuggestions: Suggestion[] = uniqueShops.map((name) => ({
            label: name,
            type: "shop" as const,
          }));

          const uniqueLocations = Array.from(
            new Set(
              data.flatMap((artist) => [
                artist.city_name,
                artist.state_name,
                artist.country_name,
              ])
            )
          ).filter(Boolean) as string[];
          const locationSuggestions: Suggestion[] = uniqueLocations.map(
            (location) => ({
              label: location,
              type: "location" as const,
            })
          );

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
    if (query.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query.trim())}`);
    }
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trad Tattoo Directory</h1>

      <HeroMessage />
      <SearchBar
        onSearch={handleSearch}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
      />

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default MainApp;
