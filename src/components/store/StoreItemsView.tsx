import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStoreProducts } from "../../services/bigcartel";
import { useListControls } from "../../hooks/useListControls";
import Pagination from "../common/Pagination";
import type { BigCartelStore, StoreProductWithStore } from "../../types";
import styles from "./StoreItemsView.module.css";

function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function productFilterFn(
  p: StoreProductWithStore,
  filters: Record<string, string>
): boolean {
  if (filters.stock === "in" && p.soldOut) return false;
  const q = (filters.q || "").trim().toLowerCase();
  if (q && !`${p.name} ${p.storeName}`.toLowerCase().includes(q)) return false;
  return true;
}

function productSortFn(
  a: StoreProductWithStore,
  b: StoreProductWithStore,
  filters: Record<string, string>
): number {
  switch (filters.sort) {
    case "price-asc":
      return a.price - b.price;
    case "price-desc":
      return b.price - a.price;
    default: {
      const da = a.createdAt ? Date.parse(a.createdAt) : 0;
      const db = b.createdAt ? Date.parse(b.createdAt) : 0;
      return db - da;
    }
  }
}

interface StoreItemsViewProps {
  stores: BigCartelStore[];
}

export default function StoreItemsView({ stores }: StoreItemsViewProps) {
  const [items, setItems] = useState<StoreProductWithStore[]>([]);
  const [doneCount, setDoneCount] = useState(0);

  // Progressive aggregate: kick off every store's fetch; the browser throttles
  // concurrency to api.bigcartel.com, so items stream in over a few seconds.
  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setDoneCount(0);
    stores.forEach(store => {
      fetchStoreProducts(store.subdomain).then(products => {
        if (cancelled) return;
        const enriched = products
          .filter(p => p.imageUrl)
          .map(p => ({
            ...p,
            storeName: store.name,
            storeKind: store.kind,
            storeSubdomain: store.subdomain,
            storeProfilePath: store.profilePath,
          }));
        if (enriched.length) setItems(prev => [...prev, ...enriched]);
        setDoneCount(c => c + 1);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [stores]);

  const {
    filters,
    setFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalFiltered,
    paginatedItems,
  } = useListControls<StoreProductWithStore>({
    items,
    filterFn: productFilterFn,
    sortFn: productSortFn,
    defaultPerPage: 60,
  });

  const loading = doneCount < stores.length;

  return (
    <div>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search items or artists&hellip;"
          value={filters.q || ""}
          onChange={e => setFilter("q", e.target.value)}
        />
        <select
          className={styles.select}
          value={filters.sort || "newest"}
          onChange={e => setFilter("sort", e.target.value)}
          aria-label="Sort items"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={filters.stock === "in"}
            onChange={e => setFilter("stock", e.target.checked ? "in" : "")}
          />
          In stock
        </label>
        <span className={styles.count}>
          {totalFiltered} {totalFiltered === 1 ? "item" : "items"}
          {loading ? " \u00b7 loading\u2026" : ""}
        </span>
      </div>

      {totalFiltered === 0 ? (
        <div className={styles.empty}>
          {loading ? "Loading items\u2026" : "No items match."}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedItems.map(item => (
              <div
                key={`${item.storeSubdomain}-${item.id}`}
                className={styles.card}
              >
                <a
                  className={styles.imgLink}
                  href={item.productUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={item.name}
                >
                  <img
                    className={styles.img}
                    src={item.imageUrl ?? ""}
                    alt={item.name}
                    loading="lazy"
                  />
                  {item.soldOut && (
                    <span className={styles.soldBadge}>Sold</span>
                  )}
                </a>
                <div className={styles.meta}>
                  <a
                    className={styles.name}
                    href={item.productUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {item.name}
                  </a>
                  <div className={styles.metaRow}>
                    <span className={styles.price}>
                      {item.soldOut ? "Sold out" : formatPrice(item.price)}
                    </span>
                    {item.storeProfilePath ? (
                      <Link
                        className={styles.store}
                        to={item.storeProfilePath}
                      >
                        {item.storeName}
                      </Link>
                    ) : (
                      <span className={styles.store}>{item.storeName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
