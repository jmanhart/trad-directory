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
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  artists,
  hasSearched,
}) => {
  if (!hasSearched) {
    return null; // Don't render anything if no search has been performed
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
