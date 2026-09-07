import { useState, useEffect } from "react";
import { fetchBigCartelStores } from "../../services/api";
import type { BigCartelStore } from "../../types";
import StoreCard from "../store/StoreCard";
import StoreItemsView from "../store/StoreItemsView";
import styles from "./StorePage.module.css";

type Mode = "stores" | "items";

export default function StorePage() {
  const [stores, setStores] = useState<BigCartelStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("stores");

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
          <div className={styles.toolbar}>
            <p className={styles.count}>
              {mode === "stores"
                ? `${stores.length} ${stores.length === 1 ? "store" : "stores"}`
                : "Browse everything for sale"}
            </p>
            <div className={styles.modeToggle} role="group" aria-label="View">
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "stores" ? styles.modeActive : ""}`}
                aria-pressed={mode === "stores"}
                onClick={() => setMode("stores")}
              >
                Stores
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === "items" ? styles.modeActive : ""}`}
                aria-pressed={mode === "items"}
                onClick={() => setMode("items")}
              >
                Items
              </button>
            </div>
          </div>
        )}
      </header>

      {isLoading && <div className={styles.state}>Loading stores&hellip;</div>}
      {error && (
        <div className={`${styles.state} ${styles.error}`}>{error}</div>
      )}
      {!isLoading && !error && stores.length === 0 && (
        <div className={styles.state}>No stores yet.</div>
      )}

      {hasStores && mode === "stores" && (
        <div className={styles.grid}>
          {stores.map(store => (
            <StoreCard key={store.subdomain} store={store} />
          ))}
        </div>
      )}

      {hasStores && mode === "items" && <StoreItemsView stores={stores} />}
    </div>
  );
}
