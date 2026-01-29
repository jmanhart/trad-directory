import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTattooShopsWithArtists, searchArtists } from "../../services/api";
import { trackSearch } from "../../utils/analytics";
import ArtistCard from "../artist/ArtistCard";
import SearchBar from "../common/SearchBar";
import SortFilter, { type SortOption } from "../common/SortFilter";
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
  created_at?: string | null;
}

export default function AllArtistsPage() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("a-z");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        setIsLoading(true);
        const data = await fetchTattooShopsWithArtists();
        setArtists(data);
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
          setSearchResults(results);

          // Track search in analytics
          trackSearch({
            search_term: searchQuery,
            search_location: "all_artists",
            results_count: results.length,
            has_results: results.length > 0,
          });
        } catch (err) {
          console.error("Error searching artists:", err);
          setError("Failed to search artists");
        }
      };
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Apply sorting to the current artist list (either search results or all artists)
  const filteredArtists = useMemo(() => {
    const artistsToSort = searchQuery.trim() ? searchResults : artists;

    if (sortBy === "a-z") {
      return [...artistsToSort].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase().trim();
        const nameB = (b.name || "").toLowerCase().trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      });
    } else if (sortBy === "recently-added") {
      return [...artistsToSort].sort((a, b) => {
        // If both have created_at, sort by most recent first
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        // If only one has created_at, prioritize it
        if (a.created_at && !b.created_at) return -1;
        if (!a.created_at && b.created_at) return 1;
        // If neither has created_at, fall back to ID (newer IDs first)
        return b.id - a.id;
      });
    }
    return artistsToSort;
  }, [artists, searchResults, searchQuery, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
              state: { fromSearch: true, previous: "/artists" },
            });
            return;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch artist slug, using ID:", error);
      }
      // Fallback to ID if slug fetch fails
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
        <div className={styles.searchFilterRow}>
          <SearchBar
            onSearch={handleSearch}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
          <SortFilter sortBy={sortBy} onSortChange={setSortBy} />
        </div>
      </div>

      {searchQuery && (
        <div className={styles.searchInfo}>
          <p>
            Showing {filteredArtists.length} result
            {filteredArtists.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        </div>
      )}

      <div className={styles.grid}>
        {filteredArtists.map(artist => (
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
}
