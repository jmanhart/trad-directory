import React from "react";
import styles from "./SortFilter.module.css";

export type SortOption = "a-z" | "recently-added";

interface SortFilterProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function SortFilter({
  sortBy,
  onSortChange,
}: SortFilterProps) {
  return (
    <div className={styles.filterContainer}>
      <label htmlFor="sort-select" className={styles.label}>
        Sort by:
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className={styles.select}
      >
        <option value="a-z">A-Z</option>
        <option value="recently-added">Recently Added</option>
      </select>
    </div>
  );
}
