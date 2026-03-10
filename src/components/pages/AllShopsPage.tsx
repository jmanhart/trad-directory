import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchAllShops } from "../../services/api";
import { useListControls } from "../../hooks/useListControls";
import ShopCard from "../shop/ShopCard";
import ShopRow from "../shop/ShopRow";
import ShopFilters from "../shop/ShopFilters";
import LocationResultsHeader from "../results/LocationResultsHeader";
import ListToolbar from "../common/ListToolbar";
import Pagination from "../common/Pagination";
import type { Shop } from "../../types";
import styles from "./AllShopsPage.module.css";

function shopFilterFn(
  shop: Shop,
  filters: Record<string, string>
): boolean {
  if (filters.country && shop.country_name !== filters.country) return false;
  return true;
}

function shopSortFn(
  a: Shop,
  b: Shop,
  filters: Record<string, string>
): number {
  if (filters.sort === "recent") {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  }
  return a.shop_name.localeCompare(b.shop_name);
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

  const filterFn = useCallback(shopFilterFn, []);
  const sortFn = useCallback(shopSortFn, []);

  const {
    viewMode,
    setViewMode,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    currentPage,
    setCurrentPage,
    totalPages,
    totalFiltered,
    paginatedItems,
  } = useListControls({
    items: shops,
    storageKey: "shops",
    filterFn,
    sortFn,
  });

  const availableCountries = useMemo(
    () =>
      [...new Set(shops.map(s => s.country_name).filter(Boolean))].sort(),
    [shops]
  );

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
        <LocationResultsHeader
          title="All Shops"
          resultsCount={totalFiltered}
        />
      </div>

      <ListToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilterCount={activeFilterCount}
        filterContent={
          <ShopFilters
            filters={filters}
            onFilterChange={setFilter}
            onClear={clearFilters}
            availableCountries={availableCountries}
          />
        }
      />

      {viewMode === "grid" ? (
        <div className={styles.grid}>
          {paginatedItems.map(shop => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {paginatedItems.map(shop => (
            <ShopRow key={shop.id} shop={shop} />
          ))}
        </div>
      )}

      {paginatedItems.length === 0 && (
        <div className={styles.noResults}>
          <p>No shops found. Try adjusting your filters.</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
