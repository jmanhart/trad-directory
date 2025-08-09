import React from "react";
import styles from "./ArtistCard.module.css";
import { Link, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const artistInstagramUrl = artist.instagram_handle
    ? `https://www.instagram.com/${artist.instagram_handle}`
    : "#";

  const fromSearch = location.pathname === "/search-results";
  const previous = `${location.pathname}${location.search || ""}`;

  return (
    <Link
      to={`/artist/${artist.id}`}
      state={{ fromSearch, previous }}
      className={styles.cardLink}
    >
      <div className={styles.card}>
        <h3 className={styles.artistName}>{artist.name}</h3>

        {artist.instagram_handle && (
          <a
            href={artistInstagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            onClick={(e) => e.stopPropagation()}
          >
            @{artist.instagram_handle}
          </a>
        )}

        <div className={styles.details}>
          <p>{artist.shop_name || "N/A"}</p>
          <p>{artist.city_name || "N/A"}</p>
          <p>{artist.state_name || "N/A"}</p>
          <p>{artist.country_name || "N/A"}</p>
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;
