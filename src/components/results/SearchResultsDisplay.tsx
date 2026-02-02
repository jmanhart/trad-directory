import styles from "../pages/SearchResults.module.css";
import LocationResultsHeader from "./LocationResultsHeader";

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
          <LocationResultsHeader
            title={searchQuery}
            resultsCount={hasSearched ? filteredResults.length : undefined}
          />
        </div>
      )}
      {/* Intentionally no list rendering here; ResultsSection handles cards */}
      {/* Intentionally no no-results block here; handled in parent */}
    </div>
  );
}
