import type { ReactNode } from "react";
import styles from "./Tag.module.css";

export type TagTone = "primary" | "soft" | "neutral";

export interface TagProps {
  /** Tag text, e.g. "BETA". */
  children: ReactNode;
  /**
   * Visual tone:
   * - `primary` — solid brand fill (strong emphasis)
   * - `soft` (default) — subtle brand tint (quiet label like BETA)
   * - `neutral` — muted grey
   */
  tone?: TagTone;
  /** Extra class for one-off layout tweaks. */
  className?: string;
}

/**
 * A small, static label chip (uppercase) for statuses/flags like BETA or NEW.
 * Presentational only — for interactive chips use `Pill`, for counts use `CountBadge`.
 */
export default function Tag({ children, tone = "soft", className }: TagProps) {
  return (
    <span className={`${styles.tag} ${styles[tone]} ${className ?? ""}`}>
      {children}
    </span>
  );
}
