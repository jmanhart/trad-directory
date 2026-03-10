import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchTattooShopsWithArtists } from "../../services/api";
import { useListControls } from "../../hooks/useListControls";
import ArtistCard from "../artist/ArtistCard";
import ArtistRow from "../artist/ArtistRow";
import ArtistFilters from "../artist/ArtistFilters";
import LocationResultsHeader from "../results/LocationResultsHeader";
import ListToolbar from "../common/ListToolbar";
import Pagination from "../common/Pagination";
import type { Artist } from "../../types";
import styles from "./AllArtistsPage.module.css";

function artistFilterFn(
  artist: Artist,
  filters: Record<string, string>
): boolean {
  if (filters.country && artist.country_name !== filters.country) return false;
  if (filters.traveling === "true" && !artist.is_traveling) return false;
  return true;
}

function artistSortFn(
  a: Artist,
  b: Artist,
  filters: Record<string, string>
): number {
  if (filters.sort === "recent") {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  }
  return a.name.localeCompare(b.name);
}

export default function AllArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        setIsLoading(true);
        const data = await fetchTattooShopsWithArtists();
        setArtists(data);
      } catch (err) {
        console.error("Error loading artists:", err);
        setError("Failed to load artists");
      } finally {
        setIsLoading(false);
      }
    }

    loadArtists();
  }, []);

  const filterFn = useCallback(artistFilterFn, []);
  const sortFn = useCallback(artistSortFn, []);

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
    items: artists,
    storageKey: "artists",
    filterFn,
    sortFn,
  });

  const availableCountries = useMemo(
    () =>
      [...new Set(artists.map(a => a.country_name).filter(Boolean))].sort(),
    [artists]
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading artists...</div>
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
          title="All Artists"
          resultsCount={totalFiltered}
        />
      </div>

      <ListToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilterCount={activeFilterCount}
        filterContent={
          <ArtistFilters
            filters={filters}
            onFilterChange={setFilter}
            onClear={clearFilters}
            availableCountries={availableCountries}
          />
        }
      />

      {viewMode === "grid" ? (
        <div className={styles.grid}>
          {paginatedItems.map(artist => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {paginatedItems.map(artist => (
            <ArtistRow key={artist.id} artist={artist} />
          ))}
        </div>
      )}

      {paginatedItems.length === 0 && (
        <div className={styles.noResults}>
          <p>No artists found. Try adjusting your filters.</p>
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
