import React, { useState, useEffect } from "react";
import { fetchRecentArtists } from "../../services/api";
import ArtistCard from "../artist/ArtistCard";
import styles from "./RecentArtists.module.css";

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

interface RecentArtistsProps {
  limit?: number;
}

const RecentArtists: React.FC<RecentArtistsProps> = ({ limit = 6 }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecentArtists() {
      try {
        setIsLoading(true);
        const data = await fetchRecentArtists(limit);
        setArtists(data);
      } catch (err) {
        console.error("Error loading recent artists:", err);
        setError("Failed to load recent artists");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentArtists();
  }, [limit]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Recently Added Artists</h2>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Recently Added Artists</h2>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Recently Added Artists</h2>
      <div className={styles.grid}>
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
};

export default RecentArtists;

