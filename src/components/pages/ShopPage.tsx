import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { isNumericId } from "../../utils/slug";
import ArtistCard from "../artist/ArtistCard";
import styles from "./ShopPage.module.css";
import InstagramLogoUrl from "/logo-instagram.svg";

interface Artist {
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

interface Shop {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  address?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  artists?: Artist[];
}

export default function ShopPage() {
  const { slugOrId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fromSearch = Boolean((location.state as any)?.fromSearch);
  const previous = (location.state as any)?.previous as string | undefined;

  useEffect(() => {
    async function getShop() {
      try {
        setIsLoading(true);
        setError(null);

        if (!slugOrId) {
          throw new Error("Invalid shop identifier");
        }

        // Use the API route directly - it handles both slugs and IDs
        const response = await fetch(`/api/shops/${slugOrId}`);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to fetch shop" }));
          throw new Error(errorData.error || "Failed to fetch shop");
        }
        const apiData = await response.json();
        const data = apiData.result;
        const shopData = data as unknown as Shop & { slug?: string | null };
        setShop(shopData);

        // Redirect to slug URL if user accessed via ID and slug exists
        if (isNumericId(slugOrId) && shopData.slug) {
          navigate(`/shop/${shopData.slug}`, { replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    getShop();
  }, [slugOrId, navigate]);

  const handleBack = () => {
    if (previous) {
      navigate(previous);
    } else {
      navigate(-1);
    }
  };

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
        {fromSearch && (
          <button onClick={handleBack} className={styles.backButton}>
            ← Back to results
          </button>
        )}
        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{shop.shop_name}</h1>
            {instagramUrl && (
              <div className={styles.handle}>
                <a
                  className={styles.link}
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img
                    src={InstagramLogoUrl}
                    alt="Instagram"
                    className={styles.instagramIcon}
                  />
                  @{shop.instagram_handle}
                </a>
              </div>
            )}
          </div>
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
