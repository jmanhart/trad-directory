import React, { useState, useEffect } from "react";
import { fetchAllShops } from "../../services/api";
import ShopCard from "../shop/ShopCard";
import LocationResultsHeader from "../results/LocationResultsHeader";
import styles from "./AllShopsPage.module.css";

interface Shop {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
}

export default function AllShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShops() {
      try {
        setIsLoading(true);
        const data = await fetchAllShops();
        setShops(data);
      } catch (err) {
        console.error("Error loading shops:", err);
        setError("Failed to load shops");
      } finally {
        setIsLoading(false);
      }
    }

    loadShops();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading shops...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchInfo}>
        <LocationResultsHeader title="All Shops" resultsCount={shops.length} />
      </div>

      <div className={styles.grid}>
        {shops.map(shop => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>

      {shops.length === 0 && (
        <div className={styles.noResults}>
          <p>No shops found.</p>
        </div>
      )}
    </div>
  );
}
