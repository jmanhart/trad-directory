import { createClient } from "@supabase/supabase-js";
import { Artist } from "./types";

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

    // Get query parameters for pagination
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch all artists with pagination
    const { data: artists, error, count } = await supabase
      .from("artists")
      .select(`
        id,
        name,
        instagram_handle,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        )
      `, { count: 'exact' })
      .range(offset, offset + parseInt(limit) - 1)
      .order('name');

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({ error: "Database query failed", details: error.message });
      return;
    }

    const results: Artist[] = (artists || []).map((artist: any) => ({
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
    }));

    res.status(200).json({
      results,
      count: results.length,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
