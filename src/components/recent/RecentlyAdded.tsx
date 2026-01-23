import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchRecentArtists, fetchRecentShops } from "../../services/api";
import { formatRelativeTime } from "../../utils/relativeTime";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import InstagramLogoUrl from "/logo-instagram.svg";
import styles from "./RecentlyAdded.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
  is_traveling?: boolean;
}

interface Shop {
  id: number;
  shop_name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
}

interface RecentlyAddedProps {
  limit?: number;
}

export default function RecentlyAdded({ limit = 10 }: RecentlyAddedProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecentlyAdded() {
      try {
        setIsLoading(true);
        const [artistsData, shopsData] = await Promise.all([
          fetchRecentArtists(limit),
          fetchRecentShops(limit),
        ]);

        // The API already transforms the data, so we can use it directly
        // But we need to ensure the structure matches our interface
        const transformedArtists = artistsData.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          instagram_handle: artist.instagram_handle,
          city_name: artist.city_name || null,
          state_name: artist.state_name || null,
          country_name: artist.country_name || null,
          created_at: artist.created_at,
          is_traveling: artist.is_traveling || false,
        }));

        const transformedShops = shopsData.map((shop: any) => ({
          id: shop.id,
          shop_name: shop.shop_name,
          instagram_handle: shop.instagram_handle,
          city_name: shop.city_name || null,
          state_name: shop.state_name || null,
          country_name: shop.country_name || null,
          created_at: shop.created_at,
        }));

        setArtists(transformedArtists);
        setShops(transformedShops);
      } catch (err) {
        console.error("Error loading recently added:", err);
        setError("Failed to load recently added");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentlyAdded();
  }, [limit]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h3 className={styles.label}>Recently Added Artist</h3>
            <p className={styles.loading}>Loading...</p>
          </div>
          <div className={styles.column}>
            <h3 className={styles.label}>Recently Added Shop</h3>
            <p className={styles.loading}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }


  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        {/* Artists Column */}
        <div className={styles.column}>
          <h3 className={styles.label}>Recently Added Artist</h3>
          <div className={styles.list}>
            {artists.length === 0 ? (
              <p className={styles.empty}>No artists yet</p>
            ) : (
              artists.map((artist, index) => {
                const instagramUrl = artist.instagram_handle
                  ? `https://www.instagram.com/${artist.instagram_handle}`
                  : null;

                return (
                  <React.Fragment key={artist.id}>
                    <Link
                      to={`/artist/${artist.id}`}
                      className={styles.item}
                    >
                      <div className={styles.content}>
                        {instagramUrl ? (
                          <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.instagramLink}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(instagramUrl, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <img
                              src={InstagramLogoUrl}
                              alt="Instagram"
                              className={styles.instagramIcon}
                            />
                          </a>
                        ) : (
                          <span className={styles.iconPlaceholder} />
                        )}
                        <span className={styles.handle}>
                          {artist.instagram_handle ? `@${artist.instagram_handle}` : artist.name}
                        </span>
                        <span className={styles.city}>
                          {formatArtistLocation({
                            city_name: artist.city_name,
                            state_name: artist.state_name,
                            country_name: artist.country_name,
                            is_traveling: artist.is_traveling,
                          }) || "N/A"}
                        </span>
                        {artist.created_at && (
                          <span className={styles.time}>
                            {formatRelativeTime(artist.created_at)}
                          </span>
                        )}
                      </div>
                    </Link>
                    {index < artists.length - 1 && <div className={styles.divider} />}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Shops Column */}
        <div className={styles.column}>
          <h3 className={styles.label}>Recently Added Shop</h3>
          <div className={styles.list}>
            {shops.length === 0 ? (
              <p className={styles.empty}>No shops yet</p>
            ) : (
              shops.map((shop, index) => {
                const instagramUrl = shop.instagram_handle
                  ? `https://www.instagram.com/${shop.instagram_handle}`
                  : null;

                return (
                  <React.Fragment key={shop.id}>
                    <Link
                      to={`/shop/${shop.id}`}
                      className={styles.item}
                    >
                      <div className={styles.content}>
                        {instagramUrl ? (
                          <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.instagramLink}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(instagramUrl, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <img
                              src={InstagramLogoUrl}
                              alt="Instagram"
                              className={styles.instagramIcon}
                            />
                          </a>
                        ) : (
                          <span className={styles.iconPlaceholder} />
                        )}
                        <span className={styles.handle}>
                          {shop.instagram_handle ? `@${shop.instagram_handle}` : shop.shop_name}
                        </span>
                        <span className={styles.city}>
                          {formatArtistLocation({
                            city_name: shop.city_name,
                            state_name: shop.state_name,
                            country_name: shop.country_name,
                            is_traveling: false,
                          }) || "N/A"}
                        </span>
                        {shop.created_at && (
                          <span className={styles.time}>
                            {formatRelativeTime(shop.created_at)}
                          </span>
                        )}
                      </div>
                    </Link>
                    {index < shops.length - 1 && <div className={styles.divider} />}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
