import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchAllCountries,
  fetchTattooShopsWithArtists,
  fetchAllShops,
} from "../../services/api";
import { useListControls } from "../../hooks/useListControls";
import CountryCard, { type CountryCardData } from "../country/CountryCard";
import CountryRow from "../country/CountryRow";
import CountryFilters from "../country/CountryFilters";
import LocationResultsHeader from "../results/LocationResultsHeader";
import ListToolbar from "../common/ListToolbar";
import Pagination from "../common/Pagination";
import styles from "./AllCountriesPage.module.css";

function normalizeCountryName(name: string | undefined | null): string {
  if (!name || name === "N/A") return "";
  return name.trim();
}

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
  const [countries, setCountries] = useState<
    { id: number; country_name: string }[]
  >([]);
  const [artists, setArtists] = useState<
    { id: number; country_name?: string }[]
  >([]);
  const [shops, setShops] = useState<
    { id: number; country_name?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [countriesData, artistsData, shopsData] = await Promise.all([
          fetchAllCountries(),
          fetchTattooShopsWithArtists(),
          fetchAllShops(),
        ]);
        setCountries(countriesData);
        setArtists(artistsData);
        setShops(shopsData);
      } catch (err) {
        console.error("Error loading countries data:", err);
        setError("Failed to load countries");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const countriesWithCounts: CountryCardData[] = useMemo(() => {
    const artistCountByCountry: Record<string, number> = {};
    const shopCountByCountry: Record<string, number> = {};

    artists.forEach(a => {
      const key = normalizeCountryName(a.country_name);
      if (key)
        artistCountByCountry[key] = (artistCountByCountry[key] ?? 0) + 1;
    });

    shops.forEach(s => {
      const key = normalizeCountryName(s.country_name);
      if (key) shopCountByCountry[key] = (shopCountByCountry[key] ?? 0) + 1;
    });

    return countries.map(c => {
      const name = c.country_name;
      const artistCount = artistCountByCountry[name] ?? 0;
      const shopCount = shopCountByCountry[name] ?? 0;
      return {
        id: c.id,
        country_name: name,
        artistCount,
        shopCount,
      };
    });
  }, [countries, artists, shops]);

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
    perPage,
    setPerPage,
    totalPages,
    totalFiltered,
    paginatedItems,
    showingFrom,
    showingTo,
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
        perPage={perPage}
        onPerPageChange={setPerPage}
        totalResults={totalFiltered}
        showingFrom={showingFrom}
        showingTo={showingTo}
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
