import { useCallback, useEffect, useState } from "react";
import {
  fetchLinkHealth,
  checkLink,
  type LinkHealthRow,
  type CheckLinkResult,
} from "../../../../services/adminApi";
import styles from "./AllLinkHealthPage.module.css";

interface Filter {
  key: string;
  label: string;
  status: string;
}

const FILTERS: Filter[] = [
  { key: "flagged", label: "Flagged", status: "dead,suspect" },
  { key: "dead", label: "Dead", status: "dead" },
  { key: "suspect", label: "Suspect", status: "suspect" },
  { key: "unknown", label: "Unknown", status: "unknown" },
  { key: "unchecked", label: "Unchecked", status: "unchecked" },
  { key: "all", label: "All", status: "all" },
];

const STATUS_LABEL: Record<string, string> = {
  unchecked: "Unchecked",
  alive: "Alive",
  suspect: "Suspect",
  dead: "Dead",
  unknown: "Unknown",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleDateString();
}

export default function AllLinkHealthPage() {
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [rows, setRows] = useState<LinkHealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [justChecked, setJustChecked] = useState<Record<string, CheckLinkResult>>(
    {}
  );

  const load = useCallback((f: Filter) => {
    setLoading(true);
    setJustChecked({});
    fetchLinkHealth(f.status)
      .then(r => {
        setRows(r);
        setError(null);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "load failed")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function runCheck(r: LinkHealthRow) {
    const key = `${r.entity_type}:${r.entity_id}`;
    setBusyKey(key);
    try {
      const result = await checkLink(r.entity_type, r.entity_id);
      setJustChecked(prev => ({ ...prev, [key]: result }));
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : "check failed");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>LINK HEALTH</h1>
        <div className={styles.filters} role="group" aria-label="Status filter">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterBtn} ${
                filter.key === f.key ? styles.filterActive : ""
              }`}
              onClick={() => setFilter(f)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.caption}>
        {loading
          ? "Loading…"
          : error
            ? `Couldn't load: ${error}`
            : `${rows.length} ${rows.length === 1 ? "link" : "links"}`}
      </p>

      {!loading && !error && rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Instagram</th>
                <th>Status</th>
                <th>Last alive</th>
                <th>Last checked</th>
                <th>Detail</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const key = `${r.entity_type}:${r.entity_id}`;
                const handle = r.instagram_handle.replace(/^@/, "");
                const busy = busyKey === key;
                const jc = justChecked[key];
                const status = jc?.status ?? r.status;
                const checkedAt = jc?.checked_at ?? r.checked_at;
                const lastAlive = jc ? jc.last_alive_at : r.last_alive_at;
                const detail = jc
                  ? `${jc.probe.result} · ${jc.probe.detail}`
                  : r.error_message ??
                    (r.status_code != null ? `HTTP ${r.status_code}` : "—");
                return (
                  <tr key={key}>
                    <td>{r.entity_name}</td>
                    <td>
                      <a
                        href={`https://www.instagram.com/${handle}/`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        @{handle}
                      </a>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${styles[`badge_${status}`]}`}
                      >
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </td>
                    <td>{fmtDate(lastAlive)}</td>
                    <td>{fmtDate(checkedAt)}</td>
                    <td className={styles.detail}>{detail}</td>
                    <td className={styles.actions}>
                      <button type="button" disabled={busy} onClick={() => runCheck(r)}>
                        {busy ? "Checking…" : "Check Link"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className={styles.empty}>Nothing here — all clear.</p>
      )}
    </div>
  );
}
