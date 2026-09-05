import { useState } from "react";
import SuggestionItem from "./SuggestionItem";
import type { Suggestion } from "../../utils/suggestions";
import styles from "./SuggestionMenu.module.css";

export interface SuggestionMenuProps {
  /** Suggestions to render as options. */
  items: Suggestion[];
  /** Index of the keyboard-active row (-1 = none). */
  activeIndex?: number;
  /** Called when a row is chosen (click / tap / Enter). */
  onSelect: (suggestion: Suggestion, index: number) => void;
  /** id for the <ul role="listbox"> (pair with the input's aria-controls). */
  id?: string;
  /** Prefix for per-option ids (pair with aria-activedescendant). */
  itemIdPrefix?: string;
  /** Message shown when there are no items; omit to render nothing. */
  emptyLabel?: string;
  /** Show the per-row type badge (debug). */
  showTypeBadge?: boolean;
}

/**
 * The accessible suggestions dropdown: a `role="listbox"` of `SuggestionItem`s.
 * Presentational — the parent owns `activeIndex` and key handling (see
 * `useSuggestionNav`), so the same menu works under SearchBar and any admin
 * autocomplete.
 */
export default function SuggestionMenu({
  items,
  activeIndex = -1,
  onSelect,
  id,
  itemIdPrefix = "suggestion",
  emptyLabel,
  showTypeBadge = false,
}: SuggestionMenuProps) {
  if (items.length === 0) {
    return emptyLabel ? (
      <div className={styles.empty} role="status">
        {emptyLabel}
      </div>
    ) : null;
  }

  return (
    <ul id={id} role="listbox" className={styles.menu}>
      {items.map((suggestion, index) => (
        <SuggestionItem
          key={`${suggestion.type}-${suggestion.id ?? suggestion.label}-${index}`}
          id={`${itemIdPrefix}-${index}`}
          suggestion={suggestion}
          active={index === activeIndex}
          onSelect={() => onSelect(suggestion, index)}
          showTypeBadge={showTypeBadge}
        />
      ))}
    </ul>
  );
}

interface UseSuggestionNavArgs {
  /** Number of items currently in the menu. */
  count: number;
  /** Invoked with the active index when Enter is pressed on a highlighted row. */
  onSelect: (index: number) => void;
  /** Invoked on Escape. */
  onClose?: () => void;
}

/**
 * Keyboard navigation for a combobox input driving a `SuggestionMenu`.
 * Returns the active index and an `onKeyDown` to attach to the input:
 * ArrowDown/ArrowUp wrap through rows, Enter selects, Escape closes.
 */
export function useSuggestionNav({ count, onSelect, onClose }: UseSuggestionNavArgs) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(i => (i + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(i => (i <= 0 ? count - 1 : i - 1));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          e.preventDefault();
          onSelect(activeIndex);
        }
        break;
      case "Escape":
        setActiveIndex(-1);
        onClose?.();
        break;
    }
  };

  return { activeIndex, setActiveIndex, onKeyDown };
}
