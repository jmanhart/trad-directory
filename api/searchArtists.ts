import { createClient } from "@supabase/supabase-js";
import { Artist } from "./types";
import { withCache, CacheManager, CACHE_TTL } from "./cache";

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
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ error: "Query parameter is required" });
      return;
    }

    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Use caching for search results
    const cacheKey = CacheManager.searchKey(query);
    const searchResults = await withCache(
      cacheKey,
      CACHE_TTL.SEARCH_RESULTS,
      async () => {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        );

        // Search for artists in Supabase - optimized approach
        // Get artists with their city and shop information
        const { data: artists, error } = await supabase
          .from("artists")
          .select(
            `
            id,
            name,
            instagram_handle,
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
          .limit(200); // Increased limit to ensure we get results

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Database query failed: ${error.message}`);
        }

        // Transform the data and filter based on query
        const normalizedQuery = query.toLowerCase().replace(/^@/, "");

        const allResults: Artist[] = (artists || []).map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          instagram_handle: artist.instagram_handle || null,
          city_name: Array.isArray(artist.city)
            ? artist.city[0]?.city_name
            : artist.city?.city_name || null,
          state_name: Array.isArray(artist.city?.state)
            ? artist.city.state[0]?.state_name
            : artist.city.state?.state_name || null,
          country_name: Array.isArray(artist.city?.country)
            ? artist.city.country[0]?.country_name
            : artist.city.country?.country_name || null,
          shop_id: artist.artist_shop?.[0]?.shop?.id || null,
          shop_name: artist.artist_shop?.[0]?.shop?.shop_name || null,
          shop_instagram_handle:
            artist.artist_shop?.[0]?.shop?.instagram_handle || null,
        }));

        // Filter results based on query
        const results = allResults.filter(
          (artist) =>
            artist.name?.toLowerCase().includes(normalizedQuery) ||
            artist.instagram_handle?.toLowerCase().includes(normalizedQuery) ||
            artist.city_name?.toLowerCase().includes(normalizedQuery) ||
            artist.state_name?.toLowerCase().includes(normalizedQuery) ||
            artist.country_name?.toLowerCase().includes(normalizedQuery)
        );

        return {
          results,
          count: results.length,
          query,
        };
      }
    );

    res.status(200).json(searchResults);
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}