import { createClient } from "@supabase/supabase-js";
import { withCache, CacheManager, CACHE_TTL } from "../cache";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
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
      res.status(400).json({ error: "Shop ID is required" });
      return;
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

    // Fetch shop data (with optional caching)
    let shopData;
    try {
      const cacheKey = `shop:${id}`;
      shopData = await withCache(
        cacheKey,
        CACHE_TTL.SHOP_DATA,
        async () => {
          // Fetch specific shop by ID
          const { data: shop, error } = await supabase
            .from("tattoo_shops")
            .select(
              `
              id,
              shop_name,
              instagram_handle,
              address,
              contact,
              phone_number,
              website_url,
              city_id,
              city: cities (
                id,
                city_name,
                state: states (state_name),
                country: countries (country_name)
              )
            `
            )
            .eq("id", id)
            .single();

          if (error) {
            console.error("Supabase error:", error);
            if (error.code === "PGRST116") {
              throw new Error("Shop not found");
            }
            throw new Error(`Database query failed: ${error.message}`);
          }

          if (!shop) {
            throw new Error("Shop not found");
          }

          return shop;
        }
      );
    } catch (cacheError) {
      // If caching fails, fetch directly
      console.warn("Cache error, fetching directly:", cacheError);
      const { data: shop, error } = await supabase
        .from("tattoo_shops")
        .select(
          `
          id,
          shop_name,
          instagram_handle,
          address,
          contact,
          phone_number,
          website_url,
          city_id,
          city: cities (
            id,
            city_name,
            state: states (state_name),
            country: countries (country_name)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        if (error.code === "PGRST116") {
          res.status(404).json({ error: "Shop not found" });
          return;
        }
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!shop) {
        res.status(404).json({ error: "Shop not found" });
        return;
      }

      shopData = shop;
    }

    const result = {
      id: shopData.id,
      shop_name: shopData.shop_name,
      instagram_handle: shopData.instagram_handle || null,
      address: shopData.address || null,
      contact: shopData.contact || null,
      phone_number: shopData.phone_number || null,
      website_url: shopData.website_url || null,
      city_id: shopData.city_id || null,
      city_name: Array.isArray(shopData.city)
        ? shopData.city[0]?.city_name
        : (shopData.city as any)?.city_name || null,
      state_name: Array.isArray((shopData.city as any)?.state)
        ? (shopData.city as any).state[0]?.state_name
        : (shopData.city as any)?.state?.state_name || null,
      country_name: Array.isArray((shopData.city as any)?.country)
        ? (shopData.city as any).country[0]?.country_name
        : (shopData.city as any)?.country?.country_name || null,
    };

    res.status(200).json({
      result,
    });
  } catch (error) {
    console.error("Unexpected error in /api/shops/[id]:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
}
