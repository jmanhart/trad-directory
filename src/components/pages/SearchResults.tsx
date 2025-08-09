import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchTattooShopsWithArtists } from "../../services/api";
import ResultsSection from "../results/ResultsSection";
import SearchResultsDisplay from "../results/SearchResultsDisplay";
// import SearchBar from "../common/SearchBar";
import styles from "./SearchResults.module.css";
import { addBreadcrumb, captureException, Sentry } from "../../utils/sentry";

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

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredResults, setFilteredResults] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    async function getData() {
      try {
        setIsLoading(true);
        const data = await fetchTattooShopsWithArtists();
        console.log("Fetched data:", data); // Log fetched data
        if (data) {
          setArtists(data);
          console.log("Artists set:", data); // Log artists state

          // Generate deduplicated suggestions
          // setSuggestions([
          //   ...artistSuggestions,
          //   ...shopSuggestions,
          //   ...locationSuggestions,
          // ]);
        }
      } catch (error: unknown) {
        setError("Error fetching data.");
        console.error("Fetch error:", error);
        captureException(error as Error, {
          component: "SearchResults",
          action: "fetch_data",
        });
      } finally {
        setIsLoading(false);
      }
    }

    getData();
  }, []);

  useEffect(() => {
    if (searchQuery && artists.length > 0) {
      performSearch(searchQuery);
    }
  }, [searchQuery, artists]);

  const performSearch = (query: string) => {
    try {
      addBreadcrumb("Search performed on results page", "search", "info", {
        query,
        timestamp: new Date().toISOString(),
        component: "SearchResults",
      });

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

      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      setFilteredResults(sorted);
      setHasSearched(true);
    } catch (error) {
      captureException(error as Error, {
        component: "SearchResults",
        action: "perform_search",
        query,
      });
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={handleBackToHome} className={styles.backButton}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {console.log("Rendering SearchResults component")} {/* Log rendering */}
      <SearchResultsDisplay
        searchQuery={searchQuery}
        hasSearched={hasSearched}
        filteredResults={filteredResults}
        navigate={navigate}
      />
      {hasSearched && filteredResults.length === 0 && (
        <div className={styles.noResults}>
          <h3>No results found</h3>
          <p>Try adjusting your search terms or browse all artists below.</p>
          <button
            onClick={() => navigate("/")}
            className={styles.browseAllButton}
          >
            Browse All Artists
          </button>
        </div>
      )}
      <ResultsSection
        artists={filteredResults}
        hasSearched={hasSearched}
        showAllIfNoSearch={true}
        allArtists={artists}
      />
    </div>
  );
};

// Wrap with Sentry profiler for performance monitoring
const SentrySearchResults = Sentry.withProfiler(SearchResults, {
  name: "SearchResults",
  includeRender: true,
  includeUpdates: true,
});

export default SentrySearchResults;
