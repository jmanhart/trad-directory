import styles from "./SaveButton.module.css";

export interface SaveButtonProps {
  saved: boolean;
  saving?: boolean;
  onClick: () => void;
}

/**
 * Presentational favorite toggle. Save state + persistence live in the caller
 * (useSavedArtists / useSavedShops); this just renders the button. Gated by the
 * `accounts` flag at each call site, like the rest of the account surface.
 */
export default function SaveButton({
  saved,
  saving,
  onClick,
}: SaveButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.saveButton} ${saved ? styles.saved : ""}`}
      onClick={onClick}
      disabled={saving}
      aria-pressed={saved}
    >
      <span className={styles.icon} aria-hidden="true">
        {saved ? "★" : "☆"}
      </span>
      {saving ? "Saving…" : saved ? "Saved" : "Save"}
    </button>
  );
}
