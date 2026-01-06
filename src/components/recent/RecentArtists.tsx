import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRecentArtists } from "../../services/api";
import PillGroup from "../common/PillGroup";
import InstagramLogoUrl from "/logo-instagram.svg";
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
  const navigate = useNavigate();
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
        <p className={styles.loading}>Loading recent artists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <PillGroup
        title="Recently Added Artists"
        items={artists.map((artist) => ({
          key: artist.id,
          label: artist.instagram_handle
            ? `@${artist.instagram_handle}`
            : artist.name,
          onClick: () => navigate(`/artist/${artist.id}`),
          icon: artist.instagram_handle ? (
            <img
              src={InstagramLogoUrl}
              alt="Instagram"
              className={styles.instagramIcon}
            />
          ) : undefined,
        }))}
      />
    </div>
  );
};

export default RecentArtists;

