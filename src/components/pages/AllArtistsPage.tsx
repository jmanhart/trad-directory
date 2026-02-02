import React, { useState, useEffect } from "react";
import { fetchTattooShopsWithArtists } from "../../services/api";
import ArtistCard from "../artist/ArtistCard";
import LocationResultsHeader from "../results/LocationResultsHeader";
import styles from "./AllArtistsPage.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
  shop_name?: string;
  shop_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
}

export default function AllArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        setIsLoading(true);
        const data = await fetchTattooShopsWithArtists();
        setArtists(data);
      } catch (err) {
        console.error("Error loading artists:", err);
        setError("Failed to load artists");
      } finally {
        setIsLoading(false);
      }
    }

    loadArtists();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading artists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchInfo}>
        <LocationResultsHeader
          title="All Artists"
          resultsCount={artists.length}
        />
      </div>

      <div className={styles.grid}>
        {artists.map(artist => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>

      {artists.length === 0 && (
        <div className={styles.noResults}>
          <p>No artists found. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}
