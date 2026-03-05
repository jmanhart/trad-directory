import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";

interface AddArtistLocationData {
  artist_id: number;
  city_id: number;
  shop_id?: number;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireAdminAuth(req, res)) return;

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const data: AddArtistLocationData = req.body;
    if (!data.artist_id || !data.city_id) {
      res.status(400).json({
        error: "Missing required fields: artist_id, city_id",
      });
      return;
    }

    // Check for duplicate (artist_id, city_id, shop_id)
    let dupQuery = supabase
      .from("artist_location")
      .select("id")
      .eq("artist_id", data.artist_id)
      .eq("city_id", data.city_id);

    if (data.shop_id) {
      dupQuery = dupQuery.eq("shop_id", data.shop_id);
    } else {
      dupQuery = dupQuery.is("shop_id", null);
    }

    const { data: existing } = await dupQuery.maybeSingle();

    if (existing) {
      res.status(400).json({
        error: "This artist location already exists",
      });
      return;
    }

    const insertData: Record<string, any> = {
      artist_id: data.artist_id,
      city_id: data.city_id,
      is_primary: false,
    };

    if (data.shop_id) {
      insertData.shop_id = data.shop_id;
    }

    const { error: insertError } = await supabase
      .from("artist_location")
      .insert(insertData);

    if (insertError) {
      throw new Error(`Failed to create location: ${insertError.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Artist location added successfully",
    });
  } catch (error) {
    console.error("Error adding artist location:", error);
    res.status(500).json({
      error: "Failed to add artist location",
    });
  }
}
