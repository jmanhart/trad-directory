import SearchIcon from "../../assets/icons/searchIcon";
import styles from "./TableSearch.module.css";

export interface TableSearchProps {
  /** Current search text (controlled). */
  value: string;
  /** Called with the new text on every keystroke. */
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * `full` (default) stretches to fill its container — use above a table.
   * `compact` is a fixed, responsive-width pill for a toolbar / header bar.
   */
  variant?: "compact" | "full";
  /**
   * Optional result summary (e.g. "29 of 1275 artists"). Rendered beside the
   * input only when a non-empty string is passed; omit it to hide entirely.
   */
  resultCount?: string;
  /** Extra class on the outer container for one-off layout tweaks. */
  className?: string;
  /** Accessible label; falls back to the placeholder. */
  ariaLabel?: string;
}

/**
 * Lightweight, presentational search box for data tables. Controlled input
 * plus an optional result count. Deliberately uses a bare <input> (not the
 * form Input) so it carries no fixed control height and fits tight toolbars.
 */
export default function TableSearch({
  value,
  onChange,
  placeholder = "Search…",
  variant = "full",
  resultCount,
  className,
  ariaLabel,
}: TableSearchProps) {
  const containerClass = [
    styles.container,
    variant === "compact" ? styles.compact : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <div className={styles.inputWrapper}>
        <SearchIcon className={styles.icon} aria-hidden />
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={ariaLabel ?? placeholder}
        />
      </div>
      {resultCount ? (
        <span className={styles.resultCount}>{resultCount}</span>
      ) : null}
    </div>
  );
}
