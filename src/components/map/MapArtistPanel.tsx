import { Link } from "react-router-dom";
import { getArtistUrl, getShopUrl } from "../../services/api";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import type { Artist } from "../../types/entities";
import styles from "./MapArtistPanel.module.css";

interface MapArtistPanelProps {
  artist: Artist;
  onClose: () => void;
  showBackButton?: boolean;
}

export default function MapArtistPanel({
  artist,
  onClose,
  showBackButton,
}: MapArtistPanelProps) {
  const primaryLocation = artist.locations?.find(l => l.is_primary) ||
    artist.locations?.[0] || {
      city_name: artist.city_name,
      state_name: artist.state_name,
      country_name: artist.country_name,
      shop_name: artist.shop_name,
      shop_slug: artist.shop_slug,
      shop_instagram_handle: artist.shop_instagram_handle,
      is_primary: true,
    };

  const secondaryLocations =
    artist.locations?.filter(l => l !== primaryLocation) || [];

  const shopName = primaryLocation.shop_name || artist.shop_name;
  const shopSlug = primaryLocation.shop_slug || artist.shop_slug;
  const shopInstagram =
    primaryLocation.shop_instagram_handle || artist.shop_instagram_handle;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <Link to={getArtistUrl(artist)} className={styles.nameLink}>
            {artist.name}
          </Link>
          {artist.instagram_handle && (
            <a
              href={`https://instagram.com/${artist.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.handle}
            >
              @{artist.instagram_handle}
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
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Location</div>
          <div className={styles.location}>
            {formatArtistLocation({
              city_name: primaryLocation.city_name,
              state_name: primaryLocation.state_name,
              country_name: primaryLocation.country_name,
            })}
          </div>
          {secondaryLocations.map((loc, i) => (
            <div key={i} className={styles.secondaryLocation}>
              {formatArtistLocation({
                city_name: loc.city_name,
                state_name: loc.state_name,
                country_name: loc.country_name,
              })}
            </div>
          ))}
        </div>

        {shopName && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Shop</div>
            <div className={styles.shopRow}>
              {shopSlug ? (
                <Link
                  to={getShopUrl({ id: 0, shop_name: shopName, slug: shopSlug })}
                  className={styles.shopLink}
                >
                  {shopName}
                </Link>
              ) : (
                <span className={styles.shopName}>{shopName}</span>
              )}
              {shopInstagram && (
                <a
                  href={`https://instagram.com/${shopInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shopHandle}
                >
                  @{shopInstagram}
                </a>
              )}
            </div>
          </div>
        )}

        {artist.is_traveling && (
          <div className={styles.section}>
            <span className={styles.travelingBadge}>Traveling Artist</span>
          </div>
        )}
      </div>

      {artist.instagram_handle && (
        <div className={styles.footer}>
          <a
            href={`https://instagram.com/${artist.instagram_handle}`}
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
