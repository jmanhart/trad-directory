import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchArtists } from "../../services/api";
import ResultsSection from "../results/ResultsSection";
import SearchResultsDisplay from "../results/SearchResultsDisplay";
// import SearchBar from "../common/SearchBar";
import { trackSearch } from "../../utils/analytics";
import styles from "./SearchResults.module.css";
import { addBreadcrumb, captureException, Sentry } from "../../utils/sentry";

interface Artist {
  id: number;
  name: string;
  slug?: string | null;
  instagram_handle?: string;
  shop_name?: string;
  shop_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredResults, setFilteredResults] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  // Refs to prevent duplicate API calls
  const hasInitialized = useRef(false);
  const lastSearchQuery = useRef<string>("");

  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    // Prevent duplicate calls
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Only fetch all artists if there's no search query (for "show all" functionality)
    if (!searchQuery) {
      const fetchAllArtists = async () => {
        try {
          const { fetchTattooShopsWithArtists } = await import(
            "../../services/api"
          );
          const allArtistsData = await fetchTattooShopsWithArtists();
          setArtists(allArtistsData);
        } catch (error) {
          console.error("Error fetching all artists:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAllArtists();
    } else {
      // If there's a search query, we don't need to fetch all artists
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery && searchQuery !== lastSearchQuery.current) {
      lastSearchQuery.current = searchQuery;
      performSearch(searchQuery);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setIsLoading(true);
      console.log(`[SearchResults] Performing search for: "${query}"`);

      addBreadcrumb("Search performed on results page", "search", "info", {
        query,
        timestamp: new Date().toISOString(),
        component: "SearchResults",
      });

      const results = await searchArtists(query);
      console.log(
        `[SearchResults] Search completed. Found ${results.length} results for "${query}"`
      );

      // Track search in analytics
      trackSearch({
        search_term: query,
        search_location: "search_results",
        results_count: results.length,
        has_results: results.length > 0,
      });

      setFilteredResults(results);
      setHasSearched(true);
    } catch (error) {
      setError("Error searching artists.");
      console.error("[SearchResults] Search error:", error);
      captureException(error as Error, {
        component: "SearchResults",
        action: "perform_search",
        query,
      });
    } finally {
      setIsLoading(false);
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
}

// Wrap with Sentry profiler for performance monitoring
const SentrySearchResults = Sentry.withProfiler(SearchResults, {
  name: "SearchResults",
  includeRender: true,
  includeUpdates: true,
});

export default SentrySearchResults;
