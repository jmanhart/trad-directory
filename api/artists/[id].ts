import { createClient } from "@supabase/supabase-js";
import { Artist } from "../types";

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

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Fetch specific artist by ID
    const { data: artist, error } = await supabase
      .from("artists")
      .select(`
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
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: "Artist not found" });
        return;
      }
      res.status(500).json({ error: "Database query failed", details: error.message });
      return;
    }

    if (!artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    const result: Artist & { shop?: any } = {
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
      shop: artist.artist_shop?.[0]?.shop || null
    };

    res.status(200).json({
      result
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
