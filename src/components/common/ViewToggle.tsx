import type { ViewMode } from "../../hooks/useListControls";
import GridIcon from "../../assets/icons/gridIcon";
import ListIcon from "../../assets/icons/listIcon";
import styles from "./ViewToggle.module.css";

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle} role="group" aria-label="View mode">
      <button
        className={`${styles.btn} ${viewMode === "grid" ? styles.active : ""}`}
        onClick={() => onChange("grid")}
        aria-pressed={viewMode === "grid"}
        aria-label="Grid view"
        type="button"
      >
        <GridIcon className={styles.icon} />
      </button>
      <button
        className={`${styles.btn} ${viewMode === "row" ? styles.active : ""}`}
        onClick={() => onChange("row")}
        aria-pressed={viewMode === "row"}
        aria-label="List view"
        type="button"
      >
        <ListIcon className={styles.icon} />
      </button>
    </div>
  );
}
