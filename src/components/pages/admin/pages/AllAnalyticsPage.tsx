import { Link } from "react-router-dom";
import { useAdminDataContext } from "../AdminDataProvider";
import styles from "./AllAnalyticsPage.module.css";

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
      to: "/admin/artists",
    },
    {
      label: "Artists Missing Location",
      value: health.artistsMissingLocation,
      to: "/admin/artists",
    },
    {
      label: "Empty Cities",
      value: health.emptyCities,
      sub: "no artists or shops",
      to: "/admin/cities",
    },
    {
      label: "Orphaned Shops",
      value: health.orphanedShops,
      sub: "no linked artists",
      to: "/admin/shops",
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
