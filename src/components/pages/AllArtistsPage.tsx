import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTattooShopsWithArtists, searchArtists } from "../../services/api";
import ArtistCard from "../artist/ArtistCard";
import SearchBar from "../common/SearchBar";
import { buildSuggestions, type Suggestion } from "../../utils/suggestions";
import styles from "./AllArtistsPage.module.css";

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

const AllArtistsPage: React.FC = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        setIsLoading(true);
        const data = await fetchTattooShopsWithArtists();
        setArtists(data);
        setFilteredArtists(data);
        setSuggestions(buildSuggestions(data));
      } catch (err) {
        console.error("Error loading artists:", err);
        setError("Failed to load artists");
      } finally {
        setIsLoading(false);
      }
    }

    loadArtists();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const performSearch = async () => {
        try {
          const results = await searchArtists(searchQuery);
          setFilteredArtists(results);
        } catch (err) {
          console.error("Error searching artists:", err);
          setError("Failed to search artists");
        }
      };
      performSearch();
    } else {
      setFilteredArtists(artists);
    }
  }, [searchQuery, artists]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    if (s.type === "artist" && s.id) {
      navigate(`/artist/${s.id}`, {
        state: { fromSearch: true, previous: "/artists" },
      });
      return;
    }
    handleSearch(s.label);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading artists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>All Artists</h1>
      
      <div className={styles.searchSection}>
        <SearchBar
          onSearch={handleSearch}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
        />
      </div>

      {searchQuery && (
        <div className={styles.searchInfo}>
          <p>
            Showing {filteredArtists.length} result{filteredArtists.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        </div>
      )}

      <div className={styles.grid}>
        {filteredArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>

      {filteredArtists.length === 0 && (
        <div className={styles.noResults}>
          <p>No artists found. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
};

export default AllArtistsPage;

