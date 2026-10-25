import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { generateUniqueSlug } from "./slug";
import type { ArtistSeoInput, ShopSeoInput, CityListItem } from "./buildSeo";

// Lean, self-contained Supabase reads for the server render path. Resolves an
// artist/shop by slug-or-id (mirroring api/artists/[id].ts) and returns only
// the fields SEO/content need.

function sb(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const isNumericId = (v: string): boolean => /^\d+$/.test(v);
function extractIdFromSlug(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

/** Nested Supabase joins come back as an object or a 1-element array. */
function one<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return (v as T) ?? null;
}

interface CityRow {
  city_name?: string | null;
  state?: unknown;
  country?: unknown;
}
interface ShopRow {
  shop_name?: string | null;
  slug?: string | null;
}
interface LocationRow {
  is_primary?: boolean | null;
  city?: unknown;
  shop?: unknown;
}

function placeFromCity(city: CityRow | null): {
  city: string | null;
  state: string | null;
  country: string | null;
} {
  const state = one<{ state_name?: string | null }>(city?.state);
  const country = one<{ country_name?: string | null }>(city?.country);
  return {
    city: city?.city_name ?? null,
    state: state?.state_name ?? null,
    country: country?.country_name ?? null,
  };
}

export interface ArtistSeoResult {
  seo: ArtistSeoInput;
  shopSlug: string | null;
}

export async function fetchArtistForSeo(
  idOrSlug: string
): Promise<ArtistSeoResult | null> {
  const supabase = sb();
  if (!supabase) return null;

  const bySlug = !isNumericId(idOrSlug);
  const col = bySlug ? "slug" : "id";
  const val: string | number = bySlug ? idOrSlug : Number(idOrSlug);

  let { data } = await supabase
    .from("artists")
    .select("id, name, slug, instagram_handle")
    .eq(col, val)
    .single();

  // Fall back to the trailing -id if the slug lookup missed.
  if (!data && bySlug) {
    const id = extractIdFromSlug(idOrSlug);
    if (id) {
      ({ data } = await supabase
        .from("artists")
        .select("id, name, slug, instagram_handle")
        .eq("id", id)
        .single());
    }
  }
  if (!data) return null;
  const artist = data as unknown as {
    id: number;
    name: string;
    slug: string | null;
    instagram_handle: string | null;
  };

  const { data: locs } = await supabase
    .from("artist_location")
    .select(
      `is_primary,
       city: cities ( city_name, state: states (state_name), country: countries (country_name) ),
       shop: tattoo_shops ( shop_name, slug )`
    )
    .eq("artist_id", artist.id);

  const rows = (locs ?? []) as unknown as LocationRow[];
  const primary = rows.find(r => r.is_primary) ?? rows[0] ?? null;
  const place = placeFromCity(primary ? one<CityRow>(primary.city) : null);
  const shop = primary ? one<ShopRow>(primary.shop) : null;

  return {
    seo: {
      id: artist.id,
      name: artist.name,
      slug: artist.slug || generateUniqueSlug(artist.name, artist.id),
      instagram: artist.instagram_handle,
      city: place.city,
      state: place.state,
      country: place.country,
      shopName: shop?.shop_name ?? null,
    },
    shopSlug: shop?.slug ?? null,
  };
}

export interface ShopSeoResult {
  seo: ShopSeoInput;
  artists: CityListItem[];
}

export async function fetchShopForSeo(
  idOrSlug: string
): Promise<ShopSeoResult | null> {
  const supabase = sb();
  if (!supabase) return null;

  const bySlug = !isNumericId(idOrSlug);
  const col = bySlug ? "slug" : "id";
  const val: string | number = bySlug ? idOrSlug : Number(idOrSlug);

  let { data } = await supabase
    .from("tattoo_shops")
    .select(
      `id, shop_name, slug, instagram_handle, address,
       city: cities ( city_name, state: states (state_name), country: countries (country_name) )`
    )
    .eq(col, val)
    .single();

  if (!data && bySlug) {
    const id = extractIdFromSlug(idOrSlug);
    if (id) {
      ({ data } = await supabase
        .from("tattoo_shops")
        .select(
          `id, shop_name, slug, instagram_handle, address,
           city: cities ( city_name, state: states (state_name), country: countries (country_name) )`
        )
        .eq("id", id)
        .single());
    }
  }
  if (!data) return null;
  const shop = data as unknown as {
    id: number;
    shop_name: string;
    slug: string | null;
    instagram_handle: string | null;
    address: string | null;
    city?: unknown;
  };

  const place = placeFromCity(one<CityRow>(shop.city));

  const { data: locs } = await supabase
    .from("artist_location")
    .select(`artist: artists ( id, name, slug )`)
    .eq("shop_id", shop.id);

  const seen = new Set<number>();
  const artists: CityListItem[] = [];
  for (const row of (locs ?? []) as unknown as {
    artist?: unknown;
  }[]) {
    const a = one<{ id: number; name: string; slug: string | null }>(row.artist);
    if (!a || seen.has(a.id)) continue;
    seen.add(a.id);
    artists.push({ name: a.name, slug: a.slug || generateUniqueSlug(a.name, a.id) });
  }

  return {
    seo: {
      id: shop.id,
      name: shop.shop_name,
      slug: shop.slug || generateUniqueSlug(shop.shop_name, shop.id),
      instagram: shop.instagram_handle,
      address: shop.address,
      city: place.city,
      state: place.state,
      country: place.country,
      artistCount: artists.length,
    },
    artists,
  };
}
