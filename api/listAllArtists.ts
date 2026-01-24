import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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

    // Fetch ALL artists without pagination
    const {
      data: artists,
      error,
    } = await supabase
      .from("artists")
      .select(
        `
        id,
        name,
        instagram_handle,
        is_traveling,
        city: cities!left (
          city_name,
          state: states!left (state_name),
          country: countries!left (country_name)
        ),
        artist_shop (
          shop: tattoo_shops (id, shop_name, instagram_handle)
        )
      `
      )
      .order("name");

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({
        error: "Database query failed",
        details: error.message,
      });
      return;
    }

    const results = (artists || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      instagram_handle: artist.instagram_handle || null,
      is_traveling: artist.is_traveling || false,
      city_name: Array.isArray(artist.city)
        ? artist.city[0]?.city_name
        : artist.city?.city_name || null,
      state_name: Array.isArray(artist.city?.state)
        ? artist.city.state[0]?.state_name
        : artist.city?.state?.state_name || null,
      country_name: Array.isArray(artist.city?.country)
        ? artist.city.country[0]?.country_name
        : artist.city?.country?.country_name || null,
      shop_name: artist.artist_shop?.[0]?.shop?.shop_name || null,
      shop_instagram_handle: artist.artist_shop?.[0]?.shop?.instagram_handle || null,
    }));

    res.status(200).json({ artists: results });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}
