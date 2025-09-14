import { createClient } from "@supabase/supabase-js";
import { withCache, CacheManager, CACHE_TTL } from "./cache";

interface Shop {
  id: number;
  shop_name: string;
  instagram_handle?: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  artist_count?: number;
}

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
    const { query, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Create cache key based on parameters
    const cacheKey = `${CacheManager.shopsKey(query)}:${page}:${limit}`;

    // Use caching for shops data
    const shopsData = await withCache(
      cacheKey,
      CACHE_TTL.SHOP_DATA,
      async () => {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        );

        let supabaseQuery = supabase.from("tattoo_shops").select(
          `
            id,
            shop_name,
            instagram_handle,
            address,
            city: cities (
              city_name,
              state: states (state_name),
              country: countries (country_name)
            )
          `,
          { count: "exact" }
        );

        // Add search filter if query is provided
        if (query) {
          supabaseQuery = supabaseQuery.ilike("shop_name", `%${query}%`);
        }

        const {
          data: shops,
          error,
          count,
        } = await supabaseQuery
          .range(offset, offset + parseInt(limit) - 1)
          .order("shop_name");

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(`Database query failed: ${error.message}`);
        }

        const results: Shop[] = (shops || []).map((shop: any) => ({
          id: shop.id,
          shop_name: shop.shop_name,
          instagram_handle: shop.instagram_handle || null,
          address: shop.address || null,
          city_name: Array.isArray(shop.city)
            ? shop.city[0]?.city_name
            : shop.city?.city_name || null,
          state_name: Array.isArray(shop.city?.state)
            ? shop.city.state[0]?.state_name
            : shop.city.state?.state_name || null,
          country_name: Array.isArray(shop.city?.country)
            ? shop.city.country[0]?.country_name
            : shop.city.country?.country_name || null,
        }));

        return {
          results,
          count: results.length,
          total: count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count || 0) / parseInt(limit)),
          query: query || null,
        };
      }
    );

    res.status(200).json(shopsData);
  } catch (error) {
    console.error("Unexpected error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
