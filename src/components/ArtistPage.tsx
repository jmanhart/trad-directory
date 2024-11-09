import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchArtistById } from "../services/api"; // Create this API call
import styles from "./ArtistPage.module.css";

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

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getArtist() {
      try {
        const data = await fetchArtistById(Number(id));
        setArtist(data);
      } catch (error: any) {
        setError("Error fetching artist details.");
        console.error(error);
      }
    }

    if (id) getArtist();
  }, [id]);

  if (!artist) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <h1>{artist.name}</h1>
      {error && <p className="error-message">{error}</p>}
      {/* The rest of the artist details */}
    </div>
  );
};

export default ArtistPage;
