import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAllShops } from "../../services/api";
import InstagramLogoUrl from "/logo-instagram.svg";
import styles from "./AllShopsPage.module.css";

interface Shop {
  id: number;
  shop_name: string;
  instagram_handle?: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

export default function AllShopsPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShops() {
      try {
        setIsLoading(true);
        const data = await fetchAllShops();
        setShops(data);
        setFilteredShops(data);
      } catch (err) {
        console.error("Error loading shops:", err);
        setError("Failed to load shops");
      } finally {
        setIsLoading(false);
      }
    }

    loadShops();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase();
      const filtered = shops.filter(
        (shop) =>
          shop.shop_name?.toLowerCase().includes(normalizedQuery) ||
          shop.instagram_handle?.toLowerCase().includes(normalizedQuery) ||
          shop.city_name?.toLowerCase().includes(normalizedQuery) ||
          shop.state_name?.toLowerCase().includes(normalizedQuery) ||
          shop.country_name?.toLowerCase().includes(normalizedQuery) ||
          shop.address?.toLowerCase().includes(normalizedQuery)
      );
      setFilteredShops(filtered);
    } else {
      setFilteredShops(shops);
    }
  }, [searchQuery, shops]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
      <h1 className={styles.title}>All Shops</h1>
      
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search shops by name, location, or Instagram..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {searchQuery && (
        <div className={styles.searchInfo}>
          <p>
            Showing {filteredShops.length} result{filteredShops.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        </div>
      )}

      <div className={styles.grid}>
        {filteredShops.map((shop) => {
          const location = [
            shop.city_name,
            shop.state_name,
            shop.country_name,
          ]
            .filter(Boolean)
            .join(", ") || "N/A";

          const shopInstagramUrl = shop.instagram_handle
            ? `https://www.instagram.com/${shop.instagram_handle}`
            : "#";

          return (
            <Link
              key={shop.id}
              to={`/shop/${shop.id}`}
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <div className={styles.header}>
                  <h3 className={styles.shopName}>{shop.shop_name}</h3>
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
                      window.open(shopInstagramUrl, "_blank", "noopener,noreferrer");
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

      {filteredShops.length === 0 && (
        <div className={styles.noResults}>
          <p>No shops found. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}

