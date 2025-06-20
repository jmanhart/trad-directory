import React from "react";
import styles from "./ArtistCard.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
  shop_name?: string;
  shop_instagram_handle?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const artistInstagramUrl = artist.instagram_handle
    ? `https://www.instagram.com/${artist.instagram_handle}`
    : "#";

  return (
    <div className={styles.card}>
      <h3 className={styles.artistName}>{artist.name}</h3>

      {artist.instagram_handle && (
        <a
          href={artistInstagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          @{artist.instagram_handle}
        </a>
      )}

      <div className={styles.details}>
        <p>{artist.shop_name || "N/A"}</p>
        <p>{artist.city_name || "N/A"}</p>
      </div>
    </div>
  );
};

export default ArtistCard;
