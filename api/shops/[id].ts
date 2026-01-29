import { createClient } from "@supabase/supabase-js";
import { withCache, CacheManager, CACHE_TTL } from "../cache";

// Import slug utilities - using inline functions since this is server-side
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
      res.status(400).json({ error: "Shop identifier is required" });
      return;
    }

    // Determine if we have a numeric ID or a slug
    let shopId: number | null = null;
    let queryBySlug = false;
    let slugValue: string | null = null;

    if (isNumericId(id)) {
      // Backward compatibility: numeric ID
      shopId = Number(id);
    } else {
      // New: slug format - query by slug directly
      queryBySlug = true;
      slugValue = id;
      // Try to extract ID from slug for fallback (if slug has ID suffix like "name-123")
      const extractedId = extractIdFromSlug(id);
      if (extractedId) {
        shopId = extractedId;
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

    // Fetch shop data (with optional caching)
    let shopData;
    try {
      const cacheKey = queryBySlug
        ? `shop:slug:${slugValue}`
        : `shop:${shopId}`;
      shopData = await withCache(cacheKey, CACHE_TTL.SHOP_DATA, async () => {
        // Build query - include slug in select
        let query = supabase.from("tattoo_shops").select(
          `
              id,
              shop_name,
              slug,
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
        );

        // Query by slug if we have one, otherwise use ID
        if (queryBySlug && slugValue) {
          query = query.eq("slug", slugValue);
        } else if (shopId !== null) {
          query = query.eq("id", shopId);
        } else {
          throw new Error("Invalid shop identifier");
        }

        const { data: shop, error } = await query.single();

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
      });
    } catch (cacheError) {
      // If caching fails, fetch directly
      console.warn("Cache error, fetching directly:", cacheError);
      let query = supabase.from("tattoo_shops").select(
        `
          id,
          shop_name,
          slug,
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
      );

      // Query by slug if we have one, otherwise use ID
      if (queryBySlug && slugValue) {
        query = query.eq("slug", slugValue);
      } else if (shopId !== null) {
        query = query.eq("id", shopId);
      } else {
        throw new Error("Invalid shop identifier");
      }

      const { data: shop, error } = await query.single();

      // If slug query fails and we have an extracted ID, fall back to ID query
      if (error && queryBySlug && shopId !== null) {
        const { data: shopById, error: errorById } = await supabase
          .from("tattoo_shops")
          .select(
            `
            id,
            shop_name,
            slug,
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
          .eq("id", shopId)
          .single();

        if (errorById) {
          throw errorById;
        }
        shopData = shopById;
      } else if (error) {
        throw error;
      } else {
        shopData = shop;
      }
    }

    // Handle case where shop not found
    if (!shopData) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    const result = {
      id: shopData.id,
      shop_name: shopData.shop_name,
      slug: shopData.slug || null,
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
  } catch (error: any) {
    console.error("Unexpected error in /api/shops/[id]:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);

    // Handle Supabase "not found" errors
    if (error?.code === "PGRST116") {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
}
