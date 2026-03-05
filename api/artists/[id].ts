import { createClient } from "@supabase/supabase-js";
import { Artist } from "../types";

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

const ARTIST_SELECT = `
  id,
  name,
  slug,
  instagram_handle,
  gender,
  url,
  contact,
  city_id,
  is_traveling,
  city: cities!artists_city_id_fkey (
    id,
    city_name,
    state: states (state_name),
    country: countries (country_name)
  ),
  artist_shop (
    shop: tattoo_shops (id, shop_name, instagram_handle)
  )
`;

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { id } = req.query;

    if (!id) {
      res.status(400).json({ error: "Artist identifier is required" });
      return;
    }

    // Determine if we have a numeric ID or a slug
    let artistId: number | null = null;
    let queryBySlug = false;
    let slugValue: string | null = null;

    if (isNumericId(id)) {
      artistId = Number(id);
    } else {
      queryBySlug = true;
      slugValue = id;
      const extractedId = extractIdFromSlug(id);
      if (extractedId) {
        artistId = extractedId;
      }
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Query by slug first, fall back to ID
    let query = supabase.from("artists").select(ARTIST_SELECT);

    if (queryBySlug && slugValue) {
      query = query.eq("slug", slugValue);
    } else if (artistId !== null) {
      query = query.eq("id", artistId);
    } else {
      res.status(400).json({ error: "Invalid artist identifier" });
      return;
    }

    const { data: artistData, error } = await query.single();

    // If slug query fails and we have an extracted ID, fall back to ID query
    if (error && queryBySlug && artistId !== null) {
      const { data: artistById, error: errorById } = await supabase
        .from("artists")
        .select(ARTIST_SELECT)
        .eq("id", artistId)
        .single();

      if (errorById) {
        if (errorById.code === "PGRST116") {
          res.status(404).json({ error: "Artist not found" });
          return;
        }
        throw errorById;
      }

      const { data: locationsById } = await supabase
        .from("artist_location")
        .select(
          `
          id,
          is_primary,
          city_id,
          shop_id,
          city: cities (
            city_name,
            state: states (state_name),
            country: countries (country_name)
          ),
          shop: tattoo_shops (id, shop_name, slug, instagram_handle)
        `
        )
        .eq("artist_id", artistById.id);

      const result = formatArtist(artistById);
      result.locations = formatLocations(locationsById || []);
      res.status(200).json({ result });
      return;
    }

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Artist not found" });
        return;
      }
      throw error;
    }

    if (!artistData) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    // Fetch secondary locations
    const { data: locations } = await supabase
      .from("artist_location")
      .select(
        `
        id,
        is_primary,
        city_id,
        shop_id,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        ),
        shop: tattoo_shops (id, shop_name, slug, instagram_handle)
      `
      )
      .eq("artist_id", artistData.id);

    const result = formatArtist(artistData);
    result.locations = formatLocations(locations || []);
    res.status(200).json({ result });
  } catch (error: any) {
    console.error("Unexpected error in /api/artists/[id]:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function formatLocations(rows: any[]): any[] {
  return rows.map(row => {
    const city = Array.isArray(row.city) ? row.city[0] : row.city;
    const shop = Array.isArray(row.shop) ? row.shop[0] : row.shop;
    return {
      id: row.id,
      city_id: row.city_id,
      city_name: city?.city_name || null,
      state_name: Array.isArray(city?.state)
        ? city.state[0]?.state_name
        : city?.state?.state_name || null,
      country_name: Array.isArray(city?.country)
        ? city.country[0]?.country_name
        : city?.country?.country_name || null,
      shop_id: row.shop_id || null,
      shop_name: shop?.shop_name || null,
      shop_slug: shop?.slug || null,
      shop_instagram_handle: shop?.instagram_handle || null,
      is_primary: row.is_primary,
    };
  });
}

function formatArtist(data: any): Artist & Record<string, any> {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug || null,
    instagram_handle: data.instagram_handle || null,
    is_traveling: data.is_traveling || false,
    city_id: data.city_id || null,
    gender: data.gender || null,
    url: data.url || null,
    contact: data.contact || null,
    city_name: Array.isArray(data.city)
      ? data.city[0]?.city_name
      : (data.city as any)?.city_name || null,
    state_name: Array.isArray((data.city as any)?.state)
      ? (data.city as any).state[0]?.state_name
      : (data.city as any)?.state?.state_name || null,
    country_name: Array.isArray((data.city as any)?.country)
      ? (data.city as any).country[0]?.country_name
      : (data.city as any)?.country?.country_name || null,
    shop: data.artist_shop?.[0]?.shop || null,
    shop_id: data.artist_shop?.[0]?.shop?.id || null,
  };
}
