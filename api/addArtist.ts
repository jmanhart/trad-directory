import { createClient } from "@supabase/supabase-js";

interface AddArtistData {
  name: string;
  instagram_handle?: string;
  gender?: string;
  url?: string;
  contact?: string;
  city_id?: number; // If provided, use this city directly
  city_name?: string; // If city_id not provided, create/find city using these
  state_name?: string;
  country_name?: string;
  shop_id?: number;
  is_traveling?: boolean; // Indicates if artist is primarily traveling
}

/**
 * Get or create a country and return its ID
 */
async function getOrCreateCountry(
  supabase: any,
  countryName: string
): Promise<number> {
  // First, try to find existing country
  const { data: existing } = await supabase
    .from("countries")
    .select("id")
    .eq("country_name", countryName)
    .single();

  if (existing) {
    return existing.id;
  }

  // If not found, create it
  const { data: newCountry, error: createError } = await supabase
    .from("countries")
    .insert({ country_name: countryName })
    .select("id")
    .single();

  if (createError || !newCountry) {
    throw new Error(
      `Failed to create country: ${createError?.message || "Unknown error"}`
    );
  }

  return newCountry.id;
}

/**
 * Get or create a state and return its ID
 */
async function getOrCreateState(
  supabase: any,
  stateName: string,
  countryId: number
): Promise<number> {
  // First, try to find existing state
  const { data: existing } = await supabase
    .from("states")
    .select("id")
    .eq("state_name", stateName)
    .eq("country_id", countryId)
    .single();

  if (existing) {
    return existing.id;
  }

  // If not found, create it
  const { data: newState, error: createError } = await supabase
    .from("states")
    .insert({ state_name: stateName, country_id: countryId })
    .select("id")
    .single();

  if (createError || !newState) {
    throw new Error(
      `Failed to create state: ${createError?.message || "Unknown error"}`
    );
  }

  return newState.id;
}

/**
 * Get or create a city and return its ID
 */
async function getOrCreateCity(
  supabase: any,
  cityName: string,
  stateId: number
): Promise<number> {
  // First, try to find existing city
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("city_name", cityName)
    .eq("state_id", stateId)
    .single();

  if (existing) {
    return existing.id;
  }

  // If not found, create it
  const { data: newCity, error: createError } = await supabase
    .from("cities")
    .insert({ city_name: cityName, state_id: stateId })
    .select("id")
    .single();

  if (createError || !newCity) {
    throw new Error(
      `Failed to create city: ${createError?.message || "Unknown error"}`
    );
  }

  return newCity.id;
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
    const data: AddArtistData = req.body;
    if (!data.name) {
      res.status(400).json({
        error: "Missing required field: name",
      });
      return;
    }

    // Determine city_id - either use provided city_id or create/find from names
    let cityId: number;
    if (data.city_id) {
      // Use provided city_id directly
      cityId = data.city_id;
    } else {
      // Create/find city from names
      if (!data.city_name || !data.state_name || !data.country_name) {
        res.status(400).json({
          error:
            "Either city_id or (city_name, state_name, country_name) must be provided",
        });
        return;
      }

      // Step 1: Get or create country
      const countryId = await getOrCreateCountry(supabase, data.country_name);

      // Step 2: Get or create state
      const stateId = await getOrCreateState(
        supabase,
        data.state_name,
        countryId
      );

      // Step 3: Get or create city
      cityId = await getOrCreateCity(supabase, data.city_name, stateId);
    }

    // Step 4: Generate slug for the artist
    // First, generate base slug
    const baseSlug = data.name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);

    // Check if slug already exists
    const { data: existingArtist } = await supabase
      .from("artists")
      .select("id")
      .eq("slug", baseSlug)
      .single();

    // Step 5: Create the artist
    const artistData: any = {
      name: data.name,
      city_id: cityId,
      // Slug will be set after insert if needed
    };

    if (data.instagram_handle) {
      artistData.instagram_handle = data.instagram_handle.replace(/^@/, "");
    }

    if (data.gender) {
      artistData.gender = data.gender;
    }

    if (data.url) {
      artistData.url = data.url;
    }

    if (data.contact) {
      artistData.contact = data.contact;
    }

    if (data.is_traveling !== undefined) {
      artistData.is_traveling = data.is_traveling;
    }

    const { data: newArtist, error: artistError } = await supabase
      .from("artists")
      .insert(artistData)
      .select("id")
      .single();

    if (artistError || !newArtist) {
      throw new Error(
        `Failed to create artist: ${artistError?.message || "Unknown error"}`
      );
    }

    // Step 6: Set slug (append ID if duplicate exists)
    const finalSlug = existingArtist ? `${baseSlug}-${newArtist.id}` : baseSlug;
    const { error: slugError } = await supabase
      .from("artists")
      .update({ slug: finalSlug })
      .eq("id", newArtist.id);

    if (slugError) {
      console.warn(`Failed to set slug for artist: ${slugError.message}`);
      // Don't throw - the artist was created successfully, just the slug failed
    }

    // Step 7: If shop_id is provided, create the artist-shop relationship
    if (data.shop_id) {
      const { error: shopError } = await supabase.from("artist_shop").insert({
        artist_id: newArtist.id,
        shop_id: data.shop_id,
      });

      if (shopError) {
        console.warn(`Failed to link artist to shop: ${shopError.message}`);
        // Don't throw - the artist was created successfully, just the link failed
      }
    }

    res.status(200).json({
      success: true,
      artist_id: newArtist.id,
      message: `Artist "${data.name}" added successfully`,
    });
  } catch (error) {
    console.error("Error adding artist:", error);
    res.status(500).json({
      error: "Failed to add artist",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
