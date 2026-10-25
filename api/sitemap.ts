import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { generateUniqueSlug, citySlug } from "./_seo/slug";

// Dynamic sitemap.xml generated from Supabase so new listings appear with no
// rebuild. Served at /sitemap.xml via a vercel.json rewrite. Cached at the CDN.

const ORIGIN = "https://www.trad-directory.com";
const STATIC_PATHS = [
  "/",
  "/artists",
  "/shops",
  "/countries",
  "/map",
  "/about",
  "/store",
];

async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string
): Promise<T[]> {
  const pageSize = 1000;
  let out: T[] = [];
  let offset = 0;
  let more = true;
  while (more) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    out = out.concat(rows);
    more = rows.length === pageSize;
    offset += pageSize;
  }
  return out;
}

function urlEntry(loc: string): string {
  return `  <url><loc>${loc}</loc></url>`;
}

interface SitemapResponse {
  setHeader(name: string, value: string): void;
  status(code: number): SitemapResponse;
  send(body: string): void;
}

function one<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return (v as T) ?? null;
}

export default async function handler(_req: unknown, res: SitemapResponse) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      res.status(500).send("Server configuration error");
      return;
    }
    const supabase = createClient(url, key);

    const artists = await fetchAllRows<{
      id: number;
      name: string;
      slug: string | null;
    }>(supabase, "artists", "id, name, slug");
    const shops = await fetchAllRows<{
      id: number;
      shop_name: string;
      slug: string | null;
    }>(supabase, "tattoo_shops", "id, shop_name, slug");

    // Cities that have at least one artist (skip thin/empty city pages).
    const artistLocs = await fetchAllRows<{ city_id: number | null }>(
      supabase,
      "artist_location",
      "city_id"
    );
    const cityIdsWithArtists = new Set(
      artistLocs.map(r => r.city_id).filter((v): v is number => v != null)
    );
    const cityRows = await fetchAllRows<{
      id: number;
      city_name: string;
      state?: unknown;
      country?: unknown;
    }>(
      supabase,
      "cities",
      "id, city_name, state:states (state_name), country:countries (country_name)"
    );
    const cityUrls: string[] = [];
    for (const c of cityRows) {
      if (!cityIdsWithArtists.has(c.id)) continue;
      const state = one<{ state_name?: string | null }>(c.state)?.state_name ?? null;
      const country =
        one<{ country_name?: string | null }>(c.country)?.country_name ?? null;
      const name = (c.city_name ?? "").trim();
      if (!name) continue;
      const region = (state || country)?.trim() || null;
      cityUrls.push(`${ORIGIN}/city/${citySlug(name, region)}`);
    }

    const locs: string[] = [
      ...STATIC_PATHS.map(p => `${ORIGIN}${p}`),
      ...cityUrls,
      ...artists.map(
        a => `${ORIGIN}/artist/${a.slug || generateUniqueSlug(a.name, a.id)}`
      ),
      ...shops.map(
        s => `${ORIGIN}/shop/${s.slug || generateUniqueSlug(s.shop_name, s.id)}`
      ),
    ];

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      locs.map(urlEntry).join("\n") +
      `\n</urlset>\n`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).send(xml);
  } catch (err) {
    console.error("[sitemap] error", err);
    res.status(500).send("sitemap error");
  }
}
