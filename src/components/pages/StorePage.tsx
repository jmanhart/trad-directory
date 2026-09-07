import { useState, useEffect } from "react";
import { fetchBigCartelStores } from "../../services/api";
import type { BigCartelStore } from "../../types";
import StoreCard from "../store/StoreCard";
import StoreItemsView from "../store/StoreItemsView";
import ModeToggle, { type StoreMode } from "../store/ModeToggle";
import styles from "./StorePage.module.css";

export default function StorePage() {
  const [stores, setStores] = useState<BigCartelStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<StoreMode>("stores");

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
      </header>

      {isLoading && <div className={styles.state}>Loading stores&hellip;</div>}
      {error && (
        <div className={`${styles.state} ${styles.error}`}>{error}</div>
      )}
      {!isLoading && !error && stores.length === 0 && (
        <div className={styles.state}>No stores yet.</div>
      )}

      {hasStores && mode === "stores" && (
        <>
          <div className={styles.toolbar}>
            <p className={styles.count}>
              {stores.length} {stores.length === 1 ? "store" : "stores"}
            </p>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <div className={styles.grid}>
            {stores.map(store => (
              <StoreCard key={store.subdomain} store={store} />
            ))}
          </div>
        </>
      )}

      {hasStores && mode === "items" && (
        <StoreItemsView stores={stores} mode={mode} onModeChange={setMode} />
      )}
    </div>
  );
}
