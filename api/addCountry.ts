import { createClient } from "@supabase/supabase-js";

interface AddCountryData {
  country_name: string;
  country_code?: string;
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
    const data: AddCountryData = req.body;
    if (!data.country_name) {
      res.status(400).json({
        error: "Missing required field: country_name",
      });
      return;
    }

    // Create the country
    const countryData: any = {
      country_name: data.country_name,
      // Set country_code to empty string if not provided (since column has NOT NULL constraint)
      country_code: data.country_code && data.country_code.trim() !== "" 
        ? data.country_code.trim() 
        : "",
    };

    const { data: newCountry, error: countryError } = await supabase
      .from("countries")
      .insert(countryData)
      .select("id")
      .single();

    if (countryError || !newCountry) {
      throw new Error(
        `Failed to create country: ${countryError?.message || "Unknown error"}`
      );
    }

    res.status(200).json({
      success: true,
      country_id: newCountry.id,
      message: `Country "${data.country_name}" added successfully`,
    });
  } catch (error) {
    console.error("Error adding country:", error);
    res.status(500).json({
      error: "Failed to add country",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

