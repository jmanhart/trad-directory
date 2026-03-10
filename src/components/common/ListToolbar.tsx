import type { ReactNode } from "react";
import type { ViewMode } from "../../hooks/useListControls";
import ViewToggle from "./ViewToggle";
import styles from "./ListToolbar.module.css";

interface ListToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterContent?: ReactNode;
  activeFilterCount?: number;
}

export default function ListToolbar({
  viewMode,
  onViewModeChange,
  filterContent,
}: ListToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        {filterContent && (
          <div className={styles.filters}>{filterContent}</div>
        )}
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}
