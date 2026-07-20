import { useAdminDataContext } from "../AdminDataProvider";
import styles from "./AllAnalyticsPage.module.css";

export default function AllAnalyticsPage() {
  const { stats, loading } = useAdminDataContext();

  const cards = [
    { label: "Total Artists", value: stats.totalArtists },
    { label: "Total Shops", value: stats.totalShops },
    { label: "Total Countries", value: stats.totalCountries },
    { label: "Total Cities", value: stats.totalCities },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ALL ANALYTICS</h1>
      <div className={styles.statsGrid}>
        {cards.map(card => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={styles.statValue}>
              {loading ? "—" : card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
