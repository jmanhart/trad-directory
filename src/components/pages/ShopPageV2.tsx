import React from "react";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import ArtistCard from "../artist/ArtistCard";
import styles from "./ShopPageV2.module.css";

export interface ShopPageV2Artist {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_id?: number | null;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}

export interface ShopPageV2Shop {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  address?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  artists?: ShopPageV2Artist[];
}

interface ShopPageV2Props {
  shop: ShopPageV2Shop | null;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  showBackButton?: boolean;
}

/**
 * New shop page view. Toggle by setting USE_NEW_SHOP_PAGE = true in ShopPage.tsx.
 */
export default function ShopPageV2({
  shop,
  error,
  isLoading,
  onBack,
  showBackButton = false,
}: ShopPageV2Props) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>Loading shop details…</div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>Unable to load shop. {error || ""}</div>
      </div>
    );
  }

  const instagramUrl = shop.instagram_handle
    ? `https://www.instagram.com/${shop.instagram_handle}`
    : null;
  const locationString =
    formatArtistLocation({
      city_name: shop.city_name,
      state_name: shop.state_name,
      country_name: shop.country_name,
      is_traveling: false,
    }) || "N/A";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {showBackButton && (
          <button type="button" onClick={onBack} className={styles.backButton}>
            ← Back to results
          </button>
        )}
        <div className={styles.header}>
          <h1 className={styles.name}>{shop.shop_name}</h1>
          {instagramUrl && (
            <a
              className={styles.link}
              href={instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              @{shop.instagram_handle}
            </a>
          )}
        </div>
        <div className={styles.meta}>
          {shop.address && (
            <div className={styles.metaItem}>
              <span className={styles.label}>Address</span>
              <span className={styles.value}>{shop.address}</span>
            </div>
          )}
          {locationString !== "N/A" && (
            <div className={styles.metaItem}>
              <span className={styles.label}>Location</span>
              <span className={styles.value}>{locationString}</span>
            </div>
          )}
          {shop.city_name && shop.city_name !== "N/A" && (
            <div className={styles.metaItem}>
              <span className={styles.label}>City</span>
              <span className={styles.value}>{shop.city_name}</span>
            </div>
          )}
          {shop.state_name && shop.state_name !== "N/A" && (
            <div className={styles.metaItem}>
              <span className={styles.label}>State</span>
              <span className={styles.value}>{shop.state_name}</span>
            </div>
          )}
          {shop.country_name && shop.country_name !== "N/A" && (
            <div className={styles.metaItem}>
              <span className={styles.label}>Country</span>
              <span className={styles.value}>{shop.country_name}</span>
            </div>
          )}
        </div>
      </div>

      {shop.artists && shop.artists.length > 0 && (
        <div className={styles.artistsSection}>
          <h2 className={styles.artistsTitle}>
            Artists at {shop.shop_name} ({shop.artists.length})
          </h2>
          <div className={styles.artistsGrid}>
            {shop.artists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
