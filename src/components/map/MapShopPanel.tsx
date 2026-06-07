import { Link } from "react-router-dom";
import { getShopUrl } from "../../services/api";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import type { Artist } from "../../types/entities";
import styles from "./MapShopPanel.module.css";

export interface MapShopData {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  city_name?: string | null;
  state_name?: string | null;
  country_name?: string | null;
  artists: Artist[];
}

interface MapShopPanelProps {
  shop: MapShopData;
  onClose: () => void;
  showBackButton?: boolean;
  onArtistClick?: (artist: Artist) => void;
}

export default function MapShopPanel({
  shop,
  onClose,
  showBackButton,
  onArtistClick,
}: MapShopPanelProps) {
  const locationString = shop.city_name
    ? formatArtistLocation({
        city_name: shop.city_name,
        state_name: shop.state_name || undefined,
        country_name: shop.country_name || undefined,
      })
    : null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <Link to={getShopUrl(shop)} className={styles.nameLink}>
            {shop.shop_name}
          </Link>
          {shop.instagram_handle && (
            <a
              href={`https://instagram.com/${shop.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.handle}
            >
              @{shop.instagram_handle}
            </a>
          )}
        </div>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title={showBackButton ? "Back" : "Close"}
        >
          {showBackButton ? "\u2190" : "\u00d7"}
        </button>
      </div>

      <div className={styles.body}>
        {locationString && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Location</div>
            <div className={styles.location}>{locationString}</div>
          </div>
        )}

        {shop.artists.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Artists</div>
            <div className={styles.artistList}>
              {shop.artists.map(artist => (
                <button
                  key={artist.id}
                  className={styles.artistItem}
                  onClick={() => onArtistClick?.(artist)}
                >
                  <span className={styles.artistName}>{artist.name}</span>
                  {artist.instagram_handle && (
                    <span className={styles.artistHandle}>
                      @{artist.instagram_handle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {shop.instagram_handle && (
        <div className={styles.footer}>
          <a
            href={`https://instagram.com/${shop.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagramButton}
          >
            View on Instagram
          </a>
        </div>
      )}
    </div>
  );
}
