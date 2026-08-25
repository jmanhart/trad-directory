import { Link } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { useAdminDataContext } from "../AdminDataProvider";
import styles from "./AllAnalyticsPage.module.css";
import {
  ENTITIES,
  MODES,
  RANGE_LABELS,
  RANGES,
} from "./timelineControls";
import type { EntityKey, Mode, Range } from "./timelineControls";

const EntryTimelineChart = lazy(() => import("./EntryTimelineChart"));

export default function AllAnalyticsPage() {
  const { stats, health, loading } = useAdminDataContext();

  const [entity, setEntity] = useState<EntityKey>("artists");
  const [range, setRange] = useState<Range>(30);
  const [mode, setMode] = useState<Mode>("new");

  const totalByEntity: Record<EntityKey, number> = {
    artists: stats.totalArtists,
    shops: stats.totalShops,
    cities: stats.totalCities,
    countries: stats.totalCountries,
  };

  const healthItems = [
    {
      label: "Broken IG Links",
      value: health.brokenLinks,
      sub: `${health.brokenLinksPct}% of profiles`,
      to: "/admin/broken-links",
    },
    {
      label: "Artists Missing IG",
      value: health.artistsMissingIg,
      to: "/admin/data?tab=artists",
    },
    {
      label: "Artists Missing Location",
      value: health.artistsMissingLocation,
      to: "/admin/data?tab=artists",
    },
    {
      label: "Empty Cities",
      value: health.emptyCities,
      sub: "no artists or shops",
      to: "/admin/data?tab=cities",
    },
    {
      label: "Orphaned Shops",
      value: health.orphanedShops,
      sub: "no linked artists",
      to: "/admin/data?tab=shops",
    },
    {
      label: "Pending Submissions",
      value: health.pendingSubmissions,
      to: "/admin/submissions",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>ALL ANALYTICS</h1>
        <div className={styles.controls}>
          <div
            className={styles.segmented}
            role="group"
            aria-label="Time range"
          >
            {RANGES.map(r => (
              <button
                key={r}
                type="button"
                className={`${styles.segBtn} ${
                  range === r ? styles.segActive : ""
                }`}
                onClick={() => setRange(r)}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <div
            className={styles.segmented}
            role="group"
            aria-label="Series mode"
          >
            {MODES.map(m => (
              <button
                key={m.key}
                type="button"
                className={`${styles.segBtn} ${
                  mode === m.key ? styles.segActive : ""
                }`}
                onClick={() => setMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tabs} role="tablist" aria-label="Metric">
          {ENTITIES.map(e => {
            const active = entity === e.key;
            return (
              <button
                key={e.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                onClick={() => setEntity(e.key)}
              >
                <span className={styles.tabLabel}>{e.label}</span>
                <span className={styles.tabValue}>
                  {loading ? "—" : totalByEntity[e.key].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
        <Suspense fallback={<div className={styles.chartFallback} />}>
          <EntryTimelineChart entity={entity} range={range} mode={mode} />
        </Suspense>
      </div>

      <h2 className={styles.sectionTitle}>Data Health</h2>
      <div className={styles.healthGrid}>
        {healthItems.map(item => {
          const warn = !loading && item.value > 0;
          return (
            <Link key={item.label} to={item.to} className={styles.healthCard}>
              <div className={styles.statLabel}>{item.label}</div>
              <div
                className={`${styles.statValue} ${
                  warn ? styles.warnValue : styles.okValue
                }`}
              >
                {loading ? "—" : item.value.toLocaleString()}
              </div>
              {item.sub && <div className={styles.healthSub}>{item.sub}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
