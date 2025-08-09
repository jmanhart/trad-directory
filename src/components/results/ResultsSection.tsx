import React from "react";
import ArtistList from "../artist/ArtistList";
import styles from "./ResultsSection.module.css";

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

interface ResultsSectionProps {
  artists: Artist[];
  hasSearched: boolean;
  showAllIfNoSearch?: boolean;
  allArtists?: Artist[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  artists,
  hasSearched,
  showAllIfNoSearch = false,
  allArtists = [],
}) => {
  if (!hasSearched && !showAllIfNoSearch) {
    return null; // Don't render anything if no search has been performed and we don't want to show all
  }

  if (!hasSearched && showAllIfNoSearch) {
    // Show all artists when no search has been performed
    return (
      <div className={styles.resultsContainer}>
        <h2 className={styles.allArtistsTitle}>All Artists</h2>
        <ArtistList artists={allArtists} />
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      {artists.length > 0 && <ArtistList artists={artists} />}
      {artists.length === 0 && (
        <p className={styles.noResults}>No results found. Please try again.</p>
      )}
    </div>
  );
};

export default ResultsSection;
