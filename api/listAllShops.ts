import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: shops, error } = await supabase
      .from("tattoo_shops")
      .select(
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
      `
      )
      .order("shop_name");

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({
        error: "Database query failed",
        details: error.message,
      });
      return;
    }

    const results = (shops || []).map((shop: any) => ({
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

    res.status(200).json({ shops: results });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}
