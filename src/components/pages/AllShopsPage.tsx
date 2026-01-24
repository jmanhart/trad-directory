import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAllShops } from "../../services/api";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { trackSearch } from "../../utils/analytics";
import SearchBar from "../common/SearchBar";
import SortFilter, { type SortOption } from "../common/SortFilter";
import { buildShopSuggestions, type Suggestion } from "../../utils/suggestions";
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
  created_at?: string | null;
}

export default function AllShopsPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("a-z");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShops() {
      try {
        setIsLoading(true);
        const data = await fetchAllShops();
        setShops(data);
        setSuggestions(buildShopSuggestions(data));
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
      setSearchResults(filtered);
      
      // Track search in analytics
      trackSearch({
        search_term: searchQuery,
        search_location: 'all_shops',
        results_count: filtered.length,
        has_results: filtered.length > 0,
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, shops]);

  // Apply sorting to the current shop list (either search results or all shops)
  const filteredShops = useMemo(() => {
    const shopsToSort = searchQuery.trim() ? searchResults : shops;
    
    if (sortBy === "a-z") {
      return [...shopsToSort].sort((a, b) => {
        const nameA = (a.shop_name || "").toLowerCase().trim();
        const nameB = (b.shop_name || "").toLowerCase().trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      });
    } else if (sortBy === "recently-added") {
      return [...shopsToSort].sort((a, b) => {
        // If both have created_at, sort by most recent first
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // If only one has created_at, prioritize it
        if (a.created_at && !b.created_at) return -1;
        if (!a.created_at && b.created_at) return 1;
        // If neither has created_at, fall back to ID (newer IDs first)
        return b.id - a.id;
      });
    }
    return shopsToSort;
  }, [shops, searchResults, searchQuery, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    if (s.type === "shop" && s.id) {
      navigate(`/shop/${s.id}`, {
        state: { fromSearch: true, previous: "/shops" },
      });
      return;
    }
    handleSearch(s.label);
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
        <div className={styles.searchFilterRow}>
          <SearchBar
            onSearch={handleSearch}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
          <SortFilter sortBy={sortBy} onSortChange={setSortBy} />
        </div>
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
          const location = formatArtistLocation({
            city_name: shop.city_name,
            state_name: shop.state_name,
            country_name: shop.country_name,
            is_traveling: false,
          }) || "N/A";

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

