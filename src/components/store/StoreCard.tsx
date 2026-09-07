import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStoreProducts } from "../../services/bigcartel";
import type { BigCartelStore, StoreProduct } from "../../types";
import styles from "./StoreCard.module.css";

const PREVIEW_COUNT = 4;

function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

interface StoreCardProps {
  store: BigCartelStore;
}

export default function StoreCard({ store }: StoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // null = not fetched yet; [] = fetched, nothing to show
  const [products, setProducts] = useState<StoreProduct[] | null>(null);

  // Only fetch once the card is near the viewport.
  useEffect(() => {
    if (visible || !cardRef.current) return;
    const el = cardRef.current;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetchStoreProducts(store.subdomain).then(data => {
      if (!cancelled) setProducts(data);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, store.subdomain]);

  const preview = (products ?? [])
    .filter(p => p.imageUrl)
    .slice(0, PREVIEW_COUNT);
  const loading = visible && products === null;

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.cardHead}>
        <span className={styles.kind}>
          {store.kind === "artist" ? "Artist" : "Studio"}
        </span>
        <h2 className={styles.storeName}>{store.name}</h2>
        <span className={styles.domain}>{store.subdomain}.bigcartel.com</span>
      </div>

      {loading && (
        <div className={styles.thumbs} aria-hidden="true">
          {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
            <div key={i} className={styles.thumbSkeleton} />
          ))}
        </div>
      )}

      {preview.length > 0 && (
        <div className={styles.thumbs}>
          {preview.map(product => (
            <a
              key={product.id}
              className={styles.thumb}
              href={product.productUrl}
              target="_blank"
              rel="noreferrer noopener"
              title={product.name}
            >
              <img
                className={styles.thumbImg}
                src={product.imageUrl!}
                alt={product.name}
                loading="lazy"
              />
              <span
                className={`${styles.thumbPrice} ${
                  product.soldOut ? styles.soldOut : ""
                }`}
              >
                {product.soldOut ? "Sold" : formatPrice(product.price)}
              </span>
            </a>
          ))}
        </div>
      )}

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
  );
}
