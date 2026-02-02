import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchArtists, searchShops } from "../../services/api";
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

interface Shop {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
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
      const fetchInitialData = async () => {
        try {
          const { fetchTattooShopsWithArtists, fetchAllShops } = await import(
            "../../services/api"
          );
          const [allArtistsData, allShopsData] = await Promise.all([
            fetchTattooShopsWithArtists(),
            fetchAllShops(),
          ]);
          setArtists(allArtistsData);
          setShops(allShopsData);
        } catch (err) {
          console.error("Error fetching initial data:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchInitialData();
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

      const [artistResults, shopResults] = await Promise.all([
        searchArtists(query),
        searchShops(query),
      ]);
      const totalCount = artistResults.length + shopResults.length;
      console.log(
        `[SearchResults] Search completed. Found ${artistResults.length} artists, ${shopResults.length} shops for "${query}"`
      );

      trackSearch({
        search_term: query,
        search_location: "search_results",
        results_count: totalCount,
        has_results: totalCount > 0,
      });

      setFilteredArtists(artistResults);
      setFilteredShops(shopResults);
      setHasSearched(true);
    } catch (err) {
      setError("Error searching.");
      console.error("[SearchResults] Search error:", err);
      captureException(err as Error, {
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

  const hasNoResults =
    hasSearched && filteredArtists.length === 0 && filteredShops.length === 0;

  return (
    <div className={styles.container}>
      <SearchResultsDisplay
        searchQuery={searchQuery}
        hasSearched={hasSearched}
        filteredArtists={filteredArtists}
        filteredShops={filteredShops}
        navigate={navigate}
      />
      {hasNoResults && (
        <div className={styles.noResults}>
          <h3>No results found</h3>
          <p>Try adjusting your search terms or browse below.</p>
          <button
            onClick={() => navigate("/")}
            className={styles.browseAllButton}
          >
            Browse All
          </button>
        </div>
      )}
      <ResultsSection
        artists={filteredArtists}
        shops={filteredShops}
        hasSearched={hasSearched}
        showAllIfNoSearch={true}
        allArtists={artists}
        allShops={shops}
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
