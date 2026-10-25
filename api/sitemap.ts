import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { generateUniqueSlug } from "./_seo/slug";

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

    const locs: string[] = [
      ...STATIC_PATHS.map(p => `${ORIGIN}${p}`),
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
