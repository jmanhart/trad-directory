import React, { useState } from "react";
import { checkInstagramLinks } from "../../services/adminApi";
import styles from "./AdminBrokenLinks.module.css";

interface BrokenLink {
  url: string;
  handle: string;
  type: "artist" | "shop";
  id: number;
  name: string;
  status: number | null;
  error: string | null;
}

export default function AdminBrokenLinks() {
  const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [stats, setStats] = useState<{ totalChecked: number; brokenCount: number } | null>(null);

  const handleCheckLinks = async () => {
    setIsLoading(true);
    setError(null);
    setBrokenLinks([]);
    setStats(null);

    try {
      const result = await checkInstagramLinks();
      setBrokenLinks(result.brokenLinks);
      setStats({
        totalChecked: result.totalChecked,
        brokenCount: result.brokenCount,
      });
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check links");
      console.error("Error checking links:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Broken Instagram Links</h1>
      <p className={styles.description}>
        Check all Instagram links and view only the broken ones (not status 200).
        This may take a while as it checks each link with delays to avoid rate limiting.
      </p>

      <button
        onClick={handleCheckLinks}
        disabled={isLoading}
        className={styles.checkButton}
      >
        {isLoading ? "Checking Links..." : "Check Instagram Links"}
      </button>

      {stats && (
        <div className={styles.stats}>
          <p>
            Checked <strong>{stats.totalChecked}</strong> links
            {stats.brokenCount > 0 && (
              <> - Found <strong className={styles.brokenCount}>{stats.brokenCount}</strong> broken links</>
            )}
            {stats.brokenCount === 0 && (
              <> - <strong className={styles.allGood}>All links are working!</strong></>
            )}
          </p>
        </div>
      )}

      {lastChecked && (
        <p className={styles.lastChecked}>
          Last checked: {lastChecked.toLocaleString()}
        </p>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {brokenLinks.length > 0 && (
        <div className={styles.linksContainer}>
          <h2 className={styles.sectionTitle}>Broken Links ({brokenLinks.length})</h2>
          <div className={styles.linksList}>
            {brokenLinks.map((link, index) => (
              <div key={`${link.type}-${link.id}-${index}`} className={styles.linkItem}>
                <div className={styles.linkHeader}>
                  <span className={styles.linkType}>{link.type === "artist" ? "👤 Artist" : "🏪 Shop"}</span>
                  <span className={styles.linkName}>{link.name}</span>
                </div>
                <div className={styles.linkDetails}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkUrl}
                  >
                    {link.url}
                  </a>
                  {link.status && (
                    <span className={styles.status}>Status: {link.status}</span>
                  )}
                  {link.error && (
                    <span className={styles.errorText}>Error: {link.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && brokenLinks.length === 0 && stats && (
        <div className={styles.noBrokenLinks}>
          <p>✅ All Instagram links are working correctly!</p>
        </div>
      )}
    </div>
  );
}

