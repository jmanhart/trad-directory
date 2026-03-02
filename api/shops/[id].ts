import { createClient } from "@supabase/supabase-js";

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

const SHOP_SELECT = `
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
`;

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

    let shopId: number | null = null;
    let queryBySlug = false;
    let slugValue: string | null = null;

    if (isNumericId(id)) {
      shopId = Number(id);
    } else {
      queryBySlug = true;
      slugValue = id;
      const extractedId = extractIdFromSlug(id);
      if (extractedId) {
        shopId = extractedId;
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

    let query = supabase.from("tattoo_shops").select(SHOP_SELECT);

    if (queryBySlug && slugValue) {
      query = query.eq("slug", slugValue);
    } else if (shopId !== null) {
      query = query.eq("id", shopId);
    } else {
      res.status(400).json({ error: "Invalid shop identifier" });
      return;
    }

    const { data: shopData, error } = await query.single();

    // If slug query fails and we have an extracted ID, fall back to ID query
    if (error && queryBySlug && shopId !== null) {
      const { data: shopById, error: errorById } = await supabase
        .from("tattoo_shops")
        .select(SHOP_SELECT)
        .eq("id", shopId)
        .single();

      if (errorById) {
        if (errorById.code === "PGRST116") {
          res.status(404).json({ error: "Shop not found" });
          return;
        }
        throw errorById;
      }

      res.status(200).json({ result: formatShop(shopById) });
      return;
    }

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Shop not found" });
        return;
      }
      throw error;
    }

    if (!shopData) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    res.status(200).json({ result: formatShop(shopData) });
  } catch (error: any) {
    console.error("Unexpected error in /api/shops/[id]:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function formatShop(data: any) {
  return {
    id: data.id,
    shop_name: data.shop_name,
    slug: data.slug || null,
    instagram_handle: data.instagram_handle || null,
    address: data.address || null,
    contact: data.contact || null,
    phone_number: data.phone_number || null,
    website_url: data.website_url || null,
    city_id: data.city_id || null,
    city_name: Array.isArray(data.city)
      ? data.city[0]?.city_name
      : (data.city as any)?.city_name || null,
    state_name: Array.isArray((data.city as any)?.state)
      ? (data.city as any).state[0]?.state_name
      : (data.city as any)?.state?.state_name || null,
    country_name: Array.isArray((data.city as any)?.country)
      ? (data.city as any).country[0]?.country_name
      : (data.city as any)?.country?.country_name || null,
  };
}
