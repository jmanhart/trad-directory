import { useCallback, useEffect, useState } from "react";
import {
  fetchLinkHealth,
  updateLinkHealth,
  updateArtist,
  updateShop,
  deleteArtist,
  deleteShop,
  type LinkHealthRow,
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
  { key: "all", label: "All", status: "all" },
];

const STATUS_LABEL: Record<string, string> = {
  alive: "Alive",
  suspect: "Suspect",
  dead: "Dead",
  unknown: "Unknown",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function AllLinkHealthPage() {
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [rows, setRows] = useState<LinkHealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback((f: Filter) => {
    setLoading(true);
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

  async function act(r: LinkHealthRow, fn: () => Promise<void>) {
    setBusyKey(`${r.entity_type}:${r.entity_id}`);
    try {
      await fn();
      load(filter);
    } catch (e: unknown) {
      window.alert(e instanceof Error ? e.message : "action failed");
    } finally {
      setBusyKey(null);
    }
  }

  function fixHandle(r: LinkHealthRow) {
    const next = window.prompt(
      `New Instagram handle for ${r.entity_name}:`,
      r.instagram_handle
    );
    if (!next || !next.trim() || next.trim() === r.instagram_handle) return;
    const handle = next.trim();
    act(r, async () => {
      if (r.entity_type === "artist") {
        await updateArtist({ id: r.entity_id, instagram_handle: handle });
      } else {
        await updateShop({ id: r.entity_id, instagram_handle: handle });
      }
      await updateLinkHealth(r.entity_type, r.entity_id, "recheck");
    });
  }

  function cull(r: LinkHealthRow) {
    const ok = window.confirm(
      `Delete ${r.entity_type} "${r.entity_name}" (@${r.instagram_handle})? This cannot be undone.`
    );
    if (!ok) return;
    act(r, async () => {
      if (r.entity_type === "artist") await deleteArtist(r.entity_id);
      else await deleteShop(r.entity_id);
    });
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
                <th>Type</th>
                <th>Name</th>
                <th>Instagram</th>
                <th>Status</th>
                <th>Streak</th>
                <th>Last alive</th>
                <th>Last checked</th>
                <th>Detail</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const key = `${r.entity_type}:${r.entity_id}`;
                const handle = r.instagram_handle.replace(/^@/, "");
                const busy = busyKey === key;
                return (
                  <tr key={key}>
                    <td>{r.entity_type}</td>
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
                        className={`${styles.badge} ${styles[`badge_${r.status}`]}`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td>{r.fail_streak}</td>
                    <td>{fmtDate(r.last_alive_at)}</td>
                    <td>{fmtDate(r.checked_at)}</td>
                    <td className={styles.detail}>
                      {r.error_message ??
                        (r.status_code != null ? `HTTP ${r.status_code}` : "—")}
                    </td>
                    <td className={styles.actions}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          act(r, () =>
                            updateLinkHealth(r.entity_type, r.entity_id, "recheck")
                          )
                        }
                      >
                        Re-check
                      </button>
                      <button type="button" disabled={busy} onClick={() => fixHandle(r)}>
                        Fix handle
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          act(r, () =>
                            updateLinkHealth(r.entity_type, r.entity_id, "ignore")
                          )
                        }
                      >
                        Ignore
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={styles.danger}
                        onClick={() => cull(r)}
                      >
                        Delete
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
