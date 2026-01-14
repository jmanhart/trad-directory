import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchRecentShops } from "../../services/api";
import { formatRelativeTime } from "../../utils/relativeTime";
import InstagramLogoUrl from "/logo-instagram.svg";
import styles from "./RecentShops.module.css";

interface Shop {
  id: number;
  shop_name: string;
  instagram_handle?: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
}

interface RecentShopsProps {
  limit?: number;
}

export default function RecentShops({ limit = 6 }: RecentShopsProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecentShops() {
      try {
        setIsLoading(true);
        const data = await fetchRecentShops(limit);
        setShops(data);
      } catch (err) {
        console.error("Error loading recent shops:", err);
        setError("Failed to load recent shops");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentShops();
  }, [limit]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Recently Added Shops</h2>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Recently Added Shops</h2>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Recently Added Shops</h2>
      <div className={styles.grid}>
        {shops.map((shop) => {
          const shopInstagramUrl = shop.instagram_handle
            ? `https://www.instagram.com/${shop.instagram_handle}`
            : "#";

          const location = [
            shop.city_name,
            shop.state_name,
            shop.country_name,
          ]
            .filter(Boolean)
            .join(", ") || "N/A";

          return (
            <Link
              key={shop.id}
              to={`/shop/${shop.id}`}
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <div className={styles.header}>
                  <h3 className={styles.shopName}>{shop.shop_name}</h3>
                  {shop.created_at && (
                    <span className={styles.timestampLabel}>
                      {formatRelativeTime(shop.created_at)}
                    </span>
                  )}
                </div>

                {shop.instagram_handle && (
                  <a
                    href={shopInstagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(shopInstagramUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <img
                      src={InstagramLogoUrl}
                      alt="Instagram"
                      className={styles.instagramIcon}
                    />
                    @{shop.instagram_handle}
                  </a>
                )}

                <div className={styles.details}>
                  {shop.address && (
                    <p className={styles.address}>{shop.address}</p>
                  )}
                  <p className={styles.location}>{location}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

