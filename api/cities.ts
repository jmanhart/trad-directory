import { createClient } from "@supabase/supabase-js";
import { Artist } from "./types";

interface CityResult {
  city_name: string;
  state_name: string;
  country_name: string;
  artist_count: number;
  artists: Artist[];
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
    const { city, state, country, include_artists = false, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

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

    if (include_artists === 'true') {
      // Get cities with their artists
      let query = supabase
        .from("cities")
        .select(`
          city_name,
          state: states (state_name),
          country: countries (country_name),
          artists (
            id,
            name,
            instagram_handle
          )
        `, { count: 'exact' });

      // Add filters
      if (city) query = query.ilike("city_name", `%${city}%`);
      if (state) query = query.eq("state.state_name", state);
      if (country) query = query.eq("country.country_name", country);

      const { data: cities, error, count } = await query
        .range(offset, offset + parseInt(limit) - 1)
        .order('city_name');

      if (error) {
        console.error("Supabase error:", error);
        res.status(500).json({ error: "Database query failed", details: error.message });
        return;
      }

      const results: CityResult[] = (cities || []).map((city: any) => ({
        city_name: city.city_name,
        state_name: city.state?.state_name || null,
        country_name: city.country?.country_name || null,
        artist_count: city.artists?.length || 0,
        artists: (city.artists || []).map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          instagram_handle: artist.instagram_handle || null,
          city_name: city.city_name,
          state_name: city.state?.state_name || null,
          country_name: city.country?.country_name || null,
        }))
      }));

      res.status(200).json({
        results,
        count: results.length,
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      });

    } else {
      // Get just city statistics
      let query = supabase
        .from("cities")
        .select(`
          city_name,
          state: states (state_name),
          country: countries (country_name),
          artists (id)
        `, { count: 'exact' });

      // Add filters
      if (city) query = query.ilike("city_name", `%${city}%`);
      if (state) query = query.eq("state.state_name", state);
      if (country) query = query.eq("country.country_name", country);

      const { data: cities, error, count } = await query
        .range(offset, offset + parseInt(limit) - 1)
        .order('city_name');

      if (error) {
        console.error("Supabase error:", error);
        res.status(500).json({ error: "Database query failed", details: error.message });
        return;
      }

      const results = (cities || []).map((city: any) => ({
        city_name: city.city_name,
        state_name: city.state?.state_name || null,
        country_name: city.country?.country_name || null,
        artist_count: city.artists?.length || 0
      }));

      res.status(200).json({
        results,
        count: results.length,
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      });
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
