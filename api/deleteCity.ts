import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";

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

    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "Missing required field: id" });
      return;
    }

    // Verify the city exists
    const { data: city, error: fetchError } = await supabase
      .from("cities")
      .select("id, city_name")
      .eq("id", id)
      .single();

    if (fetchError || !city) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    // Check for linked artist_location rows
    const { count: locationCount } = await supabase
      .from("artist_location")
      .select("id", { count: "exact", head: true })
      .eq("city_id", id);

    if (locationCount && locationCount > 0) {
      res.status(400).json({
        error: `Cannot delete city "${city.city_name}": ${locationCount} artist location(s) still linked. Reassign them first.`,
      });
      return;
    }

    // Check for linked tattoo_shops
    const { count: shopCount } = await supabase
      .from("tattoo_shops")
      .select("id", { count: "exact", head: true })
      .eq("city_id", id);

    if (shopCount && shopCount > 0) {
      res.status(400).json({
        error: `Cannot delete city "${city.city_name}": ${shopCount} shop(s) still linked. Reassign them first.`,
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from("cities")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete city: ${deleteError.message}`);
    }

    res.status(200).json({
      success: true,
      message: `City "${city.city_name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({
      error: "Failed to delete city",
    });
  }
}
