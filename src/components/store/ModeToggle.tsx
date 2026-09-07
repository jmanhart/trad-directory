import styles from "./ModeToggle.module.css";

export type StoreMode = "stores" | "items";

interface ModeToggleProps {
  mode: StoreMode;
  onChange: (mode: StoreMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className={styles.modeToggle} role="group" aria-label="View">
      <button
        type="button"
        className={`${styles.modeBtn} ${mode === "stores" ? styles.modeActive : ""}`}
        aria-pressed={mode === "stores"}
        onClick={() => onChange("stores")}
      >
        Stores
      </button>
      <button
        type="button"
        className={`${styles.modeBtn} ${mode === "items" ? styles.modeActive : ""}`}
        aria-pressed={mode === "items"}
        onClick={() => onChange("items")}
      >
        Items
      </button>
    </div>
  );
}
