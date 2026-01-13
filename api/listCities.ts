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

    // Fetch all cities first (without relationships to avoid null FK issues)
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("id, city_name, state_id")
      .order("city_name");

    if (citiesError) {
      console.error("Supabase error fetching cities:", citiesError);
      res.status(500).json({
        error: "Database query failed",
        details: citiesError.message,
      });
      return;
    }

    // Get unique state IDs (excluding nulls)
    const stateIds = [...new Set((cities || []).map((c: any) => c.state_id).filter(Boolean))];
    
    // Fetch states with their countries (only for cities that have states)
    let statesMap = new Map();
    if (stateIds.length > 0) {
      const { data: states, error: statesError } = await supabase
        .from("states")
        .select(
          `
          id,
          state_name,
          country_id,
          country: countries (
            id,
            country_name
          )
        `
        )
        .in("id", stateIds);

      if (statesError) {
        console.error("Supabase error fetching states:", statesError);
        res.status(500).json({
          error: "Database query failed",
          details: statesError.message,
        });
        return;
      }

      // Build a map of state_id -> state data
      (states || []).forEach((state: any) => {
        const country = Array.isArray(state.country) 
          ? state.country[0] 
          : state.country;
        statesMap.set(state.id, {
          id: state.id,
          state_name: state.state_name,
          country_id: country?.id || state.country_id || null,
          country_name: country?.country_name || null,
        });
      });
    }

    // Transform the data to a flatter structure
    const results = (cities || []).map((city: any) => {
      const state = city.state_id ? statesMap.get(city.state_id) : null;
      
      return {
        id: city.id,
        city_name: city.city_name,
        state_id: state?.id || city.state_id || null,
        state_name: state?.state_name || null,
        country_id: state?.country_id || null,
        country_name: state?.country_name || null,
      };
    });

    res.status(200).json({ cities: results });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}
