import { useState, type ReactNode } from "react";
import type { ViewMode } from "../../hooks/useListControls";
import ViewToggle from "./ViewToggle";
import styles from "./ListToolbar.module.css";

interface ListToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterContent?: ReactNode;
  activeFilterCount?: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
  totalResults: number;
  showingFrom: number;
  showingTo: number;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function ListToolbar({
  viewMode,
  onViewModeChange,
  filterContent,
  activeFilterCount = 0,
  perPage,
  onPerPageChange,
  totalResults,
  showingFrom,
  showingTo,
}: ListToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <div className={styles.left}>
          {filterContent && (
            <button
              className={`${styles.filterToggle} ${filtersOpen ? styles.filterToggleActive : ""}`}
              onClick={() => setFiltersOpen(prev => !prev)}
              type="button"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className={styles.badge}>{activeFilterCount}</span>
              )}
            </button>
          )}
          <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        </div>
        <div className={styles.right}>
          <span className={styles.resultCount}>
            {totalResults === 0
              ? "No results"
              : `Showing ${showingFrom}-${showingTo} of ${totalResults}`}
          </span>
          <select
            className={styles.perPage}
            value={perPage}
            onChange={e => onPerPageChange(Number(e.target.value))}
            aria-label="Results per page"
          >
            {PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </div>
      </div>
      {filterContent && (
        <div
          className={`${styles.filterPanel} ${filtersOpen ? styles.filterPanelOpen : ""}`}
        >
          {filterContent}
        </div>
      )}
    </div>
  );
}
