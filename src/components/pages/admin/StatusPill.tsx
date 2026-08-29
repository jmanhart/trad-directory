import styles from "./AdminAllData.module.css";

export const STATUS_PILL_LABEL: Record<string, string> = {
  unchecked: "Unchecked",
  alive: "Alive",
  suspect: "Suspect",
  dead: "Dead",
  unknown: "Unknown",
};

export function StatusPill({
  status,
  onClick,
  busy,
}: {
  status?: string;
  onClick?: () => void;
  busy?: boolean;
}) {
  const tone = status
    ? styles[`statusPill_${status}`]
    : styles.statusPill_unchecked;
  const label = busy
    ? "Checking…"
    : status
      ? STATUS_PILL_LABEL[status] ?? status
      : "—";
  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.statusPill} ${tone} ${styles.statusPillButton}`}
        disabled={busy}
        title="Run a live check"
        onClick={e => {
          e.stopPropagation();
          onClick();
        }}
      >
        {label}
      </button>
    );
  }
  if (!status) return <span className={styles.statusMuted}>—</span>;
  return (
    <span className={`${styles.statusPill} ${tone}`}>
      {STATUS_PILL_LABEL[status] ?? status}
    </span>
  );
}

export function fmtHealthDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleDateString();
}
