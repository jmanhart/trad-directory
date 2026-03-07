import styles from "./CountryFilters.module.css";

interface CountryFiltersProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
}

export default function CountryFilters({
  filters,
  onFilterChange,
  onClear,
}: CountryFiltersProps) {
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
        <option value="artists">Most artists</option>
        <option value="shops">Most shops</option>
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
