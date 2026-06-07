import styles from "./CountBadge.module.css";

interface CountBadgeProps {
  count: number;
  active?: boolean;
  className?: string;
}

export function CountBadge({ count, active, className }: CountBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${active ? styles.active : styles.inactive} ${className || ""}`}
    >
      {count}
    </span>
  );
}
