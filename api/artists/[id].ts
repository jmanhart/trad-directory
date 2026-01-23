import { createClient } from "@supabase/supabase-js";
import { Artist } from "../types";
import { withCache, CacheManager, CACHE_TTL } from "../cache";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
      res.status(400).json({ error: "Artist ID is required" });
      return;
    }

    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Use caching for artist details
    const cacheKey = CacheManager.artistKey(id);
    const artistData = await withCache(
      cacheKey,
      CACHE_TTL.ARTIST_DETAILS,
      async () => {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        );

        // Fetch specific artist by ID
        const { data: artist, error } = await supabase
          .from("artists")
          .select(
            `
            id,
            name,
            instagram_handle,
            is_traveling,
            city: cities (
              city_name,
              state: states (state_name),
              country: countries (country_name)
            ),
            artist_shop (
              shop: tattoo_shops (id, shop_name, instagram_handle)
            )
          `
          )
          .eq("id", id)
          .single();

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

    const result: Artist & { shop?: any } = {
      id: artistData.id,
      name: artistData.name,
      instagram_handle: artistData.instagram_handle || null,
      is_traveling: artistData.is_traveling || false,
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
    };

    res.status(200).json({
      result,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}
