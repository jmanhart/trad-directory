import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchBigCartelStores } from "../../services/api";
import type { BigCartelStore } from "../../types";
import styles from "./StorePage.module.css";

export default function StorePage() {
  const [stores, setStores] = useState<BigCartelStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStores() {
      try {
        setIsLoading(true);
        const data = await fetchBigCartelStores();
        setStores(data);
      } catch (err) {
        console.error("Error loading stores:", err);
        setError("Failed to load stores");
      } finally {
        setIsLoading(false);
      }
    }
    loadStores();
  }, []);

  const hasStores = !isLoading && !error && stores.length > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Store</h1>
        <p className={styles.tagline}>
          One place to find trad tattoo goods &mdash; flash, prints, and merch
          from artists and studios in the directory.
        </p>
        {hasStores && (
          <p className={styles.count}>
            {stores.length} {stores.length === 1 ? "store" : "stores"}
          </p>
        )}
      </header>

      {isLoading && <div className={styles.state}>Loading stores&hellip;</div>}
      {error && (
        <div className={`${styles.state} ${styles.error}`}>{error}</div>
      )}
      {!isLoading && !error && stores.length === 0 && (
        <div className={styles.state}>No stores yet.</div>
      )}

      {hasStores && (
        <div className={styles.grid}>
          {stores.map(store => (
            <div key={store.subdomain} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.kind}>
                  {store.kind === "artist" ? "Artist" : "Studio"}
                </span>
                <h2 className={styles.storeName}>{store.name}</h2>
                <span className={styles.domain}>
                  {store.subdomain}.bigcartel.com
                </span>
              </div>
              <div className={styles.actions}>
                <a
                  className={styles.visit}
                  href={store.storeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Visit store &#8599;
                </a>
                {store.profilePath && (
                  <Link className={styles.profile} to={store.profilePath}>
                    View on TRAD &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
