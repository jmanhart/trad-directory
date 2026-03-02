import { createClient } from "@supabase/supabase-js";

interface AddArtistShopLinkData {
  artist_id: number;
  shop_id: number;
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
    const data: AddArtistShopLinkData = req.body;
    if (!data.artist_id || !data.shop_id) {
      res.status(400).json({
        error: "Missing required fields: artist_id, shop_id",
      });
      return;
    }

    // Check if link already exists
    const { data: existing, error: checkError } = await supabase
      .from("artist_shop")
      .select("artist_id, shop_id")
      .eq("artist_id", data.artist_id)
      .eq("shop_id", data.shop_id)
      .maybeSingle();

    if (existing) {
      res.status(400).json({
        error: "This artist-shop link already exists",
      });
      return;
    }

    // Create the artist-shop link
    const linkData = {
      artist_id: data.artist_id,
      shop_id: data.shop_id,
    };

    const { error: linkError } = await supabase
      .from("artist_shop")
      .insert(linkData);

    if (linkError) {
      throw new Error(
        `Failed to create link: ${linkError.message}`
      );
    }

    // Dual-write: also insert into artist_location
    // Look up the shop's city_id to use for the location row
    const { data: shopData } = await supabase
      .from("tattoo_shops")
      .select("city_id")
      .eq("id", data.shop_id)
      .single();

    // Check if a primary location already exists for this artist
    const { data: existingPrimary } = await supabase
      .from("artist_location")
      .select("id")
      .eq("artist_id", data.artist_id)
      .eq("is_primary", true)
      .maybeSingle();

    const { error: locError } = await supabase
      .from("artist_location")
      .insert({
        artist_id: data.artist_id,
        shop_id: data.shop_id,
        city_id: shopData?.city_id || null,
        is_primary: !existingPrimary, // primary only if no primary exists yet
      });

    if (locError) {
      console.warn(`Failed to insert artist_location: ${locError.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Artist-shop link created successfully",
    });
  } catch (error) {
    console.error("Error adding artist-shop link:", error);
    res.status(500).json({
      error: "Failed to add link",
    });
  }
}

