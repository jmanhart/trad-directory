import { useState, useEffect, useCallback } from "react";
import { fetchCountriesWithCounts } from "../../services/api";
import { useListControls } from "../../hooks/useListControls";
import CountryCard, { type CountryCardData } from "../country/CountryCard";
import CountryRow from "../country/CountryRow";
import CountryFilters from "../country/CountryFilters";
import LocationResultsHeader from "../results/LocationResultsHeader";
import ListToolbar from "../common/ListToolbar";
import Pagination from "../common/Pagination";
import styles from "./AllCountriesPage.module.css";

function countrySortFn(
  a: CountryCardData,
  b: CountryCardData,
  filters: Record<string, string>
): number {
  if (filters.sort === "artists") return b.artistCount - a.artistCount;
  if (filters.sort === "shops") return b.shopCount - a.shopCount;
  return a.country_name.localeCompare(b.country_name);
}

export default function AllCountriesPage() {
  const [countriesWithCounts, setCountriesWithCounts] = useState<
    CountryCardData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchCountriesWithCounts();
        setCountriesWithCounts(data);
      } catch (err) {
        console.error("Error loading countries data:", err);
        setError("Failed to load countries");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const sortFn = useCallback(countrySortFn, []);

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
    items: countriesWithCounts,
    storageKey: "countries",
    sortFn,
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading countries...</div>
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
          title="All Countries"
          resultsCount={totalFiltered}
        />
      </div>

      <ListToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilterCount={activeFilterCount}
        filterContent={
          <CountryFilters
            filters={filters}
            onFilterChange={setFilter}
            onClear={clearFilters}
          />
        }
      />

      {viewMode === "grid" ? (
        <div className={styles.grid}>
          {paginatedItems.map(country => (
            <CountryCard key={country.id} country={country} />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {paginatedItems.map(country => (
            <CountryRow key={country.id} country={country} />
          ))}
        </div>
      )}

      {paginatedItems.length === 0 && (
        <div className={styles.noResults}>
          <p>No countries found.</p>
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
