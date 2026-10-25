import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { citySlug, generateUniqueSlug } from "./slug";

// Resolves a /city/:slug to a city + its artists and shops. Cities have no slug
// column, so we fetch the (small) city list, compute each slug, and match.
// Shared by api/render (SEO) and api/city/[slug] (SPA data).

export interface CityArtist {
  id: number;
  name: string;
  slug: string;
  instagram: string | null;
}
export interface CityShop {
  id: number;
  name: string;
  slug: string;
}
export interface CityData {
  slug: string;
  city: string;
  state: string | null;
  country: string | null;
  artists: CityArtist[];
  shops: CityShop[];
}

function one<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return (v as T) ?? null;
}

function sb(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface CityRow {
  id: number;
  city_name: string;
  state?: unknown;
  country?: unknown;
}

export async function fetchCityForSeo(slug: string): Promise<CityData | null> {
  const supabase = sb();
  if (!supabase) return null;

  const { data: cityRows } = await supabase
    .from("cities")
    .select(
      "id, city_name, state:states (state_name), country:countries (country_name)"
    );

  const rows = (cityRows ?? []) as unknown as CityRow[];
  let match: { id: number; city: string; state: string | null; country: string | null } | null =
    null;
  for (const r of rows) {
    const state = one<{ state_name?: string | null }>(r.state)?.state_name ?? null;
    const country =
      one<{ country_name?: string | null }>(r.country)?.country_name ?? null;
    const city = (r.city_name ?? "").trim();
    if (!city) continue;
    const region = (state || country)?.trim() || null;
    if (citySlug(city, region) === slug) {
      match = { id: r.id, city, state: state?.trim() || null, country: country?.trim() || null };
      break;
    }
  }
  if (!match) return null;

  const { data: shopRows } = await supabase
    .from("tattoo_shops")
    .select("id, shop_name, slug")
    .eq("city_id", match.id);

  const shops: CityShop[] = ((shopRows ?? []) as unknown as {
    id: number;
    shop_name: string;
    slug: string | null;
  }[]).map(s => ({
    id: s.id,
    name: s.shop_name,
    slug: s.slug || generateUniqueSlug(s.shop_name, s.id),
  }));

  const { data: locRows } = await supabase
    .from("artist_location")
    .select("artist: artists ( id, name, slug, instagram_handle )")
    .eq("city_id", match.id);

  const seen = new Set<number>();
  const artists: CityArtist[] = [];
  for (const row of (locRows ?? []) as unknown as { artist?: unknown }[]) {
    const a = one<{
      id: number;
      name: string;
      slug: string | null;
      instagram_handle: string | null;
    }>(row.artist);
    if (!a || seen.has(a.id)) continue;
    seen.add(a.id);
    artists.push({
      id: a.id,
      name: a.name,
      slug: a.slug || generateUniqueSlug(a.name, a.id),
      instagram: a.instagram_handle,
    });
  }

  artists.sort((x, y) => x.name.localeCompare(y.name));
  shops.sort((x, y) => x.name.localeCompare(y.name));

  return {
    slug,
    city: match.city,
    state: match.state,
    country: match.country,
    artists,
    shops,
  };
}
