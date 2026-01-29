import { createClient } from "@supabase/supabase-js";
import { Artist } from "../types";
import { withCache, CacheManager, CACHE_TTL } from "../cache";

// Import slug utilities - using dynamic import since this is server-side
function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

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
      // Backward compatibility: numeric ID
      artistId = Number(id);
    } else {
      // New: slug format - query by slug directly
      queryBySlug = true;
      slugValue = id;
      // Try to extract ID from slug for fallback (if slug has ID suffix like "name-123")
      const extractedId = extractIdFromSlug(id);
      if (extractedId) {
        artistId = extractedId;
      }
    }

    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Fetch artist data (with optional caching)
    let artistData;
    try {
      const cacheKey = queryBySlug
        ? CacheManager.artistKey(`slug:${slugValue}`)
        : CacheManager.artistKey(String(artistId));
      artistData = await withCache(
        cacheKey,
        CACHE_TTL.ARTIST_DETAILS,
        async () => {
          // Build query - include slug in select
          let query = supabase.from("artists").select(
            `
              id,
              name,
              slug,
              instagram_handle,
              gender,
              url,
              contact,
              city_id,
              is_traveling,
              city: cities (
                id,
                city_name,
                state: states (state_name),
                country: countries (country_name)
              ),
              artist_shop (
                shop: tattoo_shops (id, shop_name, instagram_handle)
              )
            `
          );

          // Query by slug if we have one, otherwise use ID
          if (queryBySlug && slugValue) {
            query = query.eq("slug", slugValue);
          } else if (artistId !== null) {
            query = query.eq("id", artistId);
          } else {
            throw new Error("Invalid artist identifier");
          }

          const { data: artist, error } = await query.single();

          if (error) {
            console.error("Supabase error:", error);
            if (error.code === "PGRST116") {
              throw new Error("Artist not found");
            }
            throw new Error(`Database query failed: ${error.message}`);
          }

          if (!artist) {
            throw new Error("Artist not found");
          }

          return artist;
        }
      );
    } catch (cacheError) {
      // If caching fails, fetch directly
      console.warn("Cache error, fetching directly:", cacheError);
      let query = supabase.from("artists").select(
        `
          id,
          name,
          slug,
          instagram_handle,
          gender,
          url,
          contact,
          city_id,
          is_traveling,
          city: cities (
            id,
            city_name,
            state: states (state_name),
            country: countries (country_name)
          ),
          artist_shop (
            shop: tattoo_shops (id, shop_name, instagram_handle)
          )
        `
      );

      // Query by slug if we have one, otherwise use ID
      if (queryBySlug && slugValue) {
        query = query.eq("slug", slugValue);
      } else if (artistId !== null) {
        query = query.eq("id", artistId);
      } else {
        throw new Error("Invalid artist identifier");
      }

      const { data: artist, error } = await query.single();

      // If slug query fails and we have an extracted ID, fall back to ID query
      if (error && queryBySlug && artistId !== null) {
        const { data: artistById, error: errorById } = await supabase
          .from("artists")
          .select(
            `
            id,
            name,
            slug,
            instagram_handle,
            gender,
            url,
            contact,
            city_id,
            is_traveling,
            city: cities (
              id,
              city_name,
              state: states (state_name),
              country: countries (country_name)
            ),
            artist_shop (
              shop: tattoo_shops (id, shop_name, instagram_handle)
            )
          `
          )
          .eq("id", artistId)
          .single();

        if (errorById) {
          throw error;
        }
        artistData = artistById;
      } else if (error) {
        throw error;
      } else {
        artistData = artist;
      }

      // Error handling is done in the catch block above
    }

    // Handle case where artist not found
    if (!artistData) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    const result: Artist & {
      shop?: any;
      city_id?: number;
      shop_id?: number;
      gender?: string | null;
      url?: string | null;
      contact?: string | null;
      slug?: string | null;
    } = {
      id: artistData.id,
      name: artistData.name,
      slug: artistData.slug || null,
      instagram_handle: artistData.instagram_handle || null,
      is_traveling: artistData.is_traveling || false,
      city_id: artistData.city_id || null,
      gender: artistData.gender || null,
      url: artistData.url || null,
      contact: artistData.contact || null,
      city_name: Array.isArray(artistData.city)
        ? artistData.city[0]?.city_name
        : (artistData.city as any)?.city_name || null,
      state_name: Array.isArray((artistData.city as any)?.state)
        ? (artistData.city as any).state[0]?.state_name
        : (artistData.city as any)?.state?.state_name || null,
      country_name: Array.isArray((artistData.city as any)?.country)
        ? (artistData.city as any).country[0]?.country_name
        : (artistData.city as any)?.country?.country_name || null,
      shop: artistData.artist_shop?.[0]?.shop || null,
      shop_id: artistData.artist_shop?.[0]?.shop?.id || null,
    };

    res.status(200).json({
      result,
    });
  } catch (error: any) {
    console.error("Unexpected error in /api/artists/[id]:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);

    // Handle Supabase "not found" errors
    if (error?.code === "PGRST116") {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
}
