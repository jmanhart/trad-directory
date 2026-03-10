import { Link } from "react-router-dom";
import { getArtistUrl, getShopUrl } from "../../services/api";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import type { Artist } from "../../types/entities";
import styles from "./CityDetailCard.module.css";

interface CityDetailCardProps {
  cityName: string;
  stateName: string | null;
  countryName: string | null;
  artists: Artist[];
  shops: { id: number; shop_name: string; slug?: string | null }[];
  loading?: boolean;
  onClose: () => void;
}

export default function CityDetailCard({
  cityName,
  stateName,
  countryName,
  artists,
  shops,
  loading,
  onClose,
}: CityDetailCardProps) {
  const location = formatArtistLocation({
    city_name: cityName,
    state_name: stateName,
    country_name: countryName,
  });

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.cityName}>{cityName}</h2>
          {(stateName || countryName) && (
            <p className={styles.location}>{location}</p>
          )}
        </div>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close"
        >
          &times;
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{artists.length}</span>
          <span className={styles.statLabel}>
            {artists.length === 1 ? "Artist" : "Artists"}
          </span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{shops.length}</span>
          <span className={styles.statLabel}>
            {shops.length === 1 ? "Shop" : "Shops"}
          </span>
        </div>
      </div>

      <div className={styles.list}>
        {loading && (
          <div className={styles.loading}>Loading artists...</div>
        )}
        {!loading && artists.length === 0 && (
          <div className={styles.loading}>No artist details available</div>
        )}
        {artists.map(artist => (
          <Link
            key={artist.id}
            to={getArtistUrl(artist)}
            className={styles.listItem}
          >
            <span className={styles.artistName}>{artist.name}</span>
            {artist.instagram_handle && (
              <span className={styles.handle}>
                @{artist.instagram_handle}
              </span>
            )}
          </Link>
        ))}

        {shops.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Shops</div>
            {shops.map(shop => (
              <Link
                key={shop.id}
                to={getShopUrl(shop)}
                className={styles.listItem}
              >
                <span className={styles.shopName}>{shop.shop_name}</span>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
