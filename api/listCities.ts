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

    // Fetch all cities with their state and country info
    const { data: cities, error } = await supabase
      .from("cities")
      .select(
        `
        id,
        city_name,
        state: states (
          id,
          state_name,
          country: countries (
            id,
            country_name
          )
        )
      `
      )
      .order("city_name");

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({
        error: "Database query failed",
        details: error.message,
      });
      return;
    }

    // Transform the data to a flatter structure
    const results = (cities || []).map((city: any) => ({
      id: city.id,
      city_name: city.city_name,
      state_id: city.state?.id || null,
      state_name: city.state?.state_name || null,
      country_id: city.state?.country?.id || null,
      country_name: city.state?.country?.country_name || null,
    }));

    res.status(200).json({ cities: results });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}

