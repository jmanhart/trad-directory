import { Link } from "react-router-dom";
import { getShopUrl } from "../../services/api";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import ShareMenu from "./ShareMenu";
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
  address?: string | null;
  phone_number?: string | null;
  website_url?: string | null;
  contact?: string | null;
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
        <div className={styles.headerActions}>
          {shop.artists.length > 0 && (
            <ShareMenu
              heading={`Traditional Tattoo Artists at ${shop.shop_name}`}
              artists={shop.artists}
              className={styles.actionButton}
            />
          )}
          <button
            className={styles.closeButton}
            onClick={onClose}
            title={showBackButton ? "Back" : "Close"}
          >
            {showBackButton ? "\u2190" : "\u00d7"}
          </button>
        </div>
      </div>

      <div className={styles.details}>
        {locationString && (
          <div className={styles.detailRow}>{locationString}</div>
        )}
        {shop.address && (
          <div className={styles.detailRow}>{shop.address}</div>
        )}
        {shop.phone_number && (
          <div className={styles.detailRow}>
            <a href={`tel:${shop.phone_number}`} className={styles.detailLink}>
              {shop.phone_number}
            </a>
          </div>
        )}
        {shop.website_url && (
          <div className={styles.detailRow}>
            <a
              href={shop.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.detailLink}
            >
              {shop.website_url.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
        {shop.contact && (
          <div className={styles.detailRow}>{shop.contact}</div>
        )}
      </div>

      <div className={styles.body}>
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
