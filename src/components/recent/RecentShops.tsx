import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRecentShops } from "../../services/api";
import PillGroup from "../common/PillGroup";
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

const RecentShops: React.FC<RecentShopsProps> = ({ limit = 6 }) => {
  const navigate = useNavigate();
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
        <p className={styles.loading}>Loading recent shops...</p>
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

  if (shops.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <PillGroup
        title="Recently Added Shops"
        items={shops.map((shop) => ({
          key: shop.id,
          label: shop.instagram_handle
            ? `@${shop.instagram_handle}`
            : shop.shop_name,
          onClick: () => navigate(`/shop/${shop.id}`),
          icon: shop.instagram_handle ? (
            <img
              src={InstagramLogoUrl}
              alt="Instagram"
              className={styles.instagramIcon}
            />
          ) : undefined,
        }))}
      />
    </div>
  );
};

export default RecentShops;

