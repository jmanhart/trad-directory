import styles from "./ArtistFilters.module.css";

interface ArtistFiltersProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  availableCountries: string[];
}

export default function ArtistFilters({
  filters,
  onFilterChange,
  onClear,
  availableCountries,
}: ArtistFiltersProps) {
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className={styles.filters}>
      <select
        className={styles.select}
        value={filters.sort || ""}
        onChange={e => onFilterChange("sort", e.target.value)}
        aria-label="Sort by"
      >
        <option value="">A-Z</option>
        <option value="recent">Last Added</option>
      </select>

      <select
        className={styles.select}
        value={filters.country || ""}
        onChange={e => onFilterChange("country", e.target.value)}
        aria-label="Filter by country"
      >
        <option value="">All Countries</option>
        {availableCountries.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={filters.traveling === "true"}
          onChange={e =>
            onFilterChange("traveling", e.target.checked ? "true" : "")
          }
        />
        Traveling only
      </label>

      {hasFilters && (
        <button
          className={styles.clearBtn}
          onClick={onClear}
          type="button"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
