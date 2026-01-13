import React from "react";
import styles from "../pages/SearchResults.module.css";

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

interface SearchResultsDisplayProps {
  searchQuery: string;
  hasSearched: boolean;
  filteredResults: Artist[];
  navigate: (path: string) => void;
}

export default function SearchResultsDisplay({
  searchQuery,
  hasSearched,
  filteredResults,
}: SearchResultsDisplayProps) {
  return (
    <div>
      {searchQuery && (
        <div className={styles.searchInfo}>
          <h2 className={styles.searchQuery}>
            Results for:{" "}
            <span className={styles.queryText}>&quot;{searchQuery}&quot;</span>
          </h2>
          {hasSearched && filteredResults.length > 0 && (
            <p className={styles.resultsCount}>
              {filteredResults.length} result
              {filteredResults.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      )}
      {/* Intentionally no list rendering here; ResultsSection handles cards */}
      {/* Intentionally no no-results block here; handled in parent */}
    </div>
  );
}
