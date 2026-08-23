import { Link } from "react-router-dom";
import { useAdminDataContext } from "../AdminDataProvider";
import styles from "./AllAnalyticsPage.module.css";
import { lazy, Suspense } from "react";

const EntryTimelineChart = lazy(() => import("./EntryTimelineChart"));

export default function AllAnalyticsPage() {
  const { stats, health, loading } = useAdminDataContext();

  const totals = [
    { label: "Total Artists", value: stats.totalArtists },
    { label: "Total Shops", value: stats.totalShops },
    { label: "Total Countries", value: stats.totalCountries },
    { label: "Total Cities", value: stats.totalCities },
  ];

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

  const fmt = (n: number) => (loading ? "—" : n.toLocaleString());

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ALL ANALYTICS</h1>

      <div className={styles.statsGrid}>
        {totals.map(card => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={styles.statValue}>{fmt(card.value)}</div>
          </div>
        ))}
      </div>

      <Suspense fallback={<div className={styles.chartFallback} />}>
        <EntryTimelineChart />
      </Suspense>

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
                {fmt(item.value)}
              </div>
              {item.sub && <div className={styles.healthSub}>{item.sub}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
