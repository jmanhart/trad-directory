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
  return (
    <a
      href={
        artist.instagram_handle
          ? `https://www.instagram.com/${artist.instagram_handle}`
          : "#"
      }
      target="_blank"
      rel="noopener noreferrer"
      className={styles.cardLink}
    >
      <div className={styles.card}>
        <span className={styles.artistName}>{artist.name}</span>
        <p>
          {" "}
          {artist.instagram_handle ? (
            <a
              href={`https://www.instagram.com/${artist.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{artist.instagram_handle}
            </a>
          ) : (
            "N/A"
          )}
        </p>
        <p>
          Shop:{" "}
          {artist.shop_instagram_handle ? (
            <a
              href={`https://www.instagram.com/${artist.shop_instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {artist.shop_name}
            </a>
          ) : (
            artist.shop_name || "N/A"
          )}
        </p>
        <p>
          {artist.city_name || "N/A"},{artist.state_name || "N/A"}.{" "}
          {artist.country_name || "N/A"}
        </p>
      </div>
    </a>
  );
};

export default ArtistCard;
