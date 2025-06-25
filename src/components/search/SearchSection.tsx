import React from "react";
import SearchBar from "../common/SearchBar";
import styles from "./SearchSection.module.css";

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
  return (
    <div className={styles.searchContainer}>
      <SearchBar onSearch={onSearch} suggestions={suggestions} />

      {hasSearched && resultsCount > 0 && (
        <p className={styles.searchResultsMessage}>
          {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
};

export default SearchSection;
