import ArtistsIcon from "../../assets/icons/artistsIcon";
import ShopsIcon from "../../assets/icons/shopsIcon";
import GlobeIcon from "../../assets/icons/globeIcon";
import type { Suggestion } from "../../utils/suggestions";
import styles from "./SuggestionItem.module.css";

const TYPE_LABEL: Record<Suggestion["type"], string> = {
  artist: "Artist",
  shop: "Shop",
  location: "Location",
};

function TypeIcon({ type }: { type: Suggestion["type"] }) {
  if (type === "artist") return <ArtistsIcon className={styles.icon} />;
  if (type === "shop") return <ShopsIcon className={styles.icon} />;
  return <GlobeIcon className={styles.icon} />;
}

export interface SuggestionItemProps {
  /** The suggestion to render. */
  suggestion: Suggestion;
  /**
   * Keyboard-highlighted row (sets aria-selected + the active style). Pointer
   * hover is handled purely in CSS; the parent menu owns which row is active.
   */
  active?: boolean;
  /** Called when the row is chosen (click / tap). */
  onSelect?: (suggestion: Suggestion) => void;
  /** DOM id so the parent listbox can point aria-activedescendant at it. */
  id?: string;
  /** Show the small type badge (Artist / Shop / Location). */
  showTypeBadge?: boolean;
}

/**
 * One row in the search suggestions menu: a typed icon, the label, an optional
 * detail, and (for locations) an artist count. States — rest, hover (pointer),
 * active (keyboard ↑/↓), pressed — are all driven from `SuggestionItem.module.css`.
 */
export default function SuggestionItem({
  suggestion,
  active = false,
  onSelect,
  id,
  showTypeBadge = false,
}: SuggestionItemProps) {
  const { type, label, detail, artistCount } = suggestion;

  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      className={`${styles.item} ${active ? styles.active : ""}`}
      data-suggestion-type={type}
      // Use mousedown/touchend (not click) so selection fires before the input
      // blur that would otherwise close the menu first.
      onMouseDown={e => {
        e.preventDefault();
        onSelect?.(suggestion);
      }}
      onTouchEnd={e => {
        e.preventDefault();
        onSelect?.(suggestion);
      }}
    >
      <TypeIcon type={type} />
      <span className={styles.label}>{label}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
      {type === "location" && artistCount !== undefined && (
        <span className={styles.count}>
          {artistCount} {artistCount === 1 ? "artist" : "artists"}
        </span>
      )}
      {showTypeBadge && (
        <span className={styles.badge}>{TYPE_LABEL[type]}</span>
      )}
    </li>
  );
}
