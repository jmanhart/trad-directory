import styles from "./ShopFilters.module.css";

interface ShopFiltersProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  availableCountries: string[];
}

export default function ShopFilters({
  filters,
  onFilterChange,
  onClear,
  availableCountries,
}: ShopFiltersProps) {
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
