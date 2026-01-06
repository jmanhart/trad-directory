import { createClient } from "@supabase/supabase-js";

interface AddCityData {
  city_name: string;
  state_id?: number | null;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
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

    // Initialize Supabase client with service key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Validate request body
    const data: AddCityData = req.body;
    if (!data.city_name) {
      res.status(400).json({
        error: "Missing required field: city_name",
      });
      return;
    }

    // Create the city
    const cityData: any = {
      city_name: data.city_name,
    };

    if (data.state_id) {
      cityData.state_id = data.state_id;
    }

    const { data: newCity, error: cityError } = await supabase
      .from("cities")
      .insert(cityData)
      .select("id")
      .single();

    if (cityError || !newCity) {
      throw new Error(
        `Failed to create city: ${cityError?.message || "Unknown error"}`
      );
    }

    res.status(200).json({
      success: true,
      city_id: newCity.id,
      message: `City "${data.city_name}" added successfully`,
    });
  } catch (error) {
    console.error("Error adding city:", error);
    res.status(500).json({
      error: "Failed to add city",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

