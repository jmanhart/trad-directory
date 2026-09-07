import type { StoreProduct } from "../types";

// BigCartel V0 public API (no auth, CORS-open) — read a store's products
// directly from the browser. Results are cached in-memory per subdomain for
// the session so cards don't re-fetch on re-render / scroll churn.
const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  at: number;
  data: StoreProduct[];
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<StoreProduct[]>>();

// Safe field access on unvalidated external JSON.
function get(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    // Narrowed to an object containing `key`; index as an unknown-valued record.
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}
function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function asNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function mapProducts(raw: unknown, subdomain: string): StoreProduct[] {
  if (!Array.isArray(raw)) return [];
  const origin = `https://${subdomain}.bigcartel.com`;
  return raw.map((product): StoreProduct => {
    const optionsRaw = get(product, "options");
    const options = Array.isArray(optionsRaw) ? optionsRaw : [];
    const soldOut =
      asString(get(product, "status")) !== "active" ||
      (options.length > 0 && options.every(o => get(o, "sold_out") === true));
    const imagesRaw = get(product, "images");
    const firstImage =
      Array.isArray(imagesRaw) && imagesRaw[0]
        ? asString(get(imagesRaw[0], "secure_url")) ||
          asString(get(imagesRaw[0], "url"))
        : null;
    return {
      id: asNumber(get(product, "id")),
      name: asString(get(product, "name")) ?? "",
      price: asNumber(get(product, "price")),
      onSale: get(product, "on_sale") === true,
      imageUrl: firstImage,
      productUrl: origin + (asString(get(product, "url")) ?? ""),
      soldOut,
      createdAt: asString(get(product, "created_at")),
    };
  });
}

// Fetch a BigCartel store's products. Never throws — returns [] on any
// failure so the card can fall back to its plain state.
export async function fetchStoreProducts(
  subdomain: string
): Promise<StoreProduct[]> {
  const cached = cache.get(subdomain);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const existing = inflight.get(subdomain);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://api.bigcartel.com/${encodeURIComponent(subdomain)}/products.json`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = mapProducts(await res.json(), subdomain);
      cache.set(subdomain, { at: Date.now(), data });
      return data;
    } catch {
      // Cache an empty result briefly so a dead/empty store isn't re-hit on
      // every scroll.
      cache.set(subdomain, { at: Date.now(), data: [] });
      return [];
    } finally {
      inflight.delete(subdomain);
    }
  })();

  inflight.set(subdomain, promise);
  return promise;
}
