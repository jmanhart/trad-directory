import styles from "../pages/SearchResults.module.css";
import LocationResultsHeader from "./LocationResultsHeader";
import SearchResultMapPreview from "../map/SearchResultMapPreview";
import type { LocationMatch } from "../../utils/locationSearch";

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
  filteredArtists: Artist[];
  filteredShops: { id: number }[];
  navigate: (path: string) => void;
  locationMatch?: LocationMatch | null;
}

export default function SearchResultsDisplay({
  searchQuery,
  hasSearched,
  filteredArtists,
  filteredShops,
  locationMatch,
}: SearchResultsDisplayProps) {
  const totalCount = filteredArtists.length + filteredShops.length;
  return (
    <div>
      {searchQuery && (
        <div className={styles.searchInfo}>
          <LocationResultsHeader
            title={locationMatch ? locationMatch.name : searchQuery}
            resultsCount={hasSearched ? totalCount : undefined}
          />
        </div>
      )}
      {locationMatch && <SearchResultMapPreview match={locationMatch} />}
      {/* Intentionally no list rendering here; ResultsSection handles cards */}
      {/* Intentionally no no-results block here; handled in parent */}
    </div>
  );
}
