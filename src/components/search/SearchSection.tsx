import React from "react";
import SearchBar from "../common/SearchBar";
import styles from "./SearchSection.module.css";
import { addBreadcrumb, captureException, Sentry } from "../../utils/sentry";

interface Suggestion {
  label: string;
  type: "artist" | "shop" | "location";
  detail?: string;
}

interface SearchSectionProps {
  onSearch: (query: string) => void;
  suggestions: Suggestion[];
  resultsCount: number;
  hasSearched: boolean;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  onSearch,
  suggestions,
  resultsCount,
  hasSearched,
}) => {
  // Enhanced search handler with Sentry tracking
  const handleSearch = (query: string) => {
    try {
      // Add breadcrumb for user action tracking
      addBreadcrumb("User performed search", "search", "info", {
        query,
        timestamp: new Date().toISOString(),
        component: "SearchSection",
      });

      // Call the original search function
      onSearch(query);
    } catch (error) {
      // Capture any errors that occur during search
      captureException(error as Error, {
        component: "SearchSection",
        action: "search",
        query,
      });
    }
  };

  // Track when suggestions are displayed
  React.useEffect(() => {
    if (suggestions.length > 0) {
      addBreadcrumb("Search suggestions displayed", "ui", "info", {
        count: suggestions.length,
        types: suggestions.map((s) => s.type),
      });
    }
  }, [suggestions]);

  // Track search results
  React.useEffect(() => {
    if (hasSearched) {
      addBreadcrumb("Search results displayed", "search", "info", {
        resultsCount,
        hasResults: resultsCount > 0,
      });
    }
  }, [hasSearched, resultsCount]);

  return (
    <div className={styles.searchContainer}>
      <SearchBar onSearch={handleSearch} suggestions={suggestions} />

      {hasSearched && resultsCount > 0 && (
        <p className={styles.searchResultsMessage}>
          {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
};

// Wrap with Sentry profiler for performance monitoring
const SentrySearchSection = Sentry.withProfiler(SearchSection, {
  name: "SearchSection",
  includeRender: true,
  includeUpdates: true,
});

export default SentrySearchSection;
