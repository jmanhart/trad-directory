import { useId, type ReactNode } from "react";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  /** Tooltip text/content shown on hover or keyboard focus. */
  content: ReactNode;
  /** The trigger element the tooltip describes. */
  children: ReactNode;
  /** Which side of the trigger the bubble sits on. Default "top". */
  placement?: "top" | "bottom";
  /** Force the tooltip visible (useful for docs/testing). */
  open?: boolean;
}

/**
 * A lightweight, accessible tooltip. The bubble matches the app's floating-
 * surface style (white card, border, shadow). Shows on hover and keyboard
 * focus; wires `aria-describedby` from the trigger to the tooltip.
 */
export default function Tooltip({
  content,
  children,
  placement = "top",
  open = false,
}: TooltipProps) {
  const id = useId();

  return (
    <span className={styles.wrapper}>
      <span className={styles.trigger} tabIndex={0} aria-describedby={id}>
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={`${styles.tooltip} ${styles[placement]} ${open ? styles.open : ""}`}
      >
        {content}
      </span>
    </span>
  );
}
