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

    const { data: country, error: fetchError } = await supabase
      .from("countries")
      .select("id, country_name")
      .eq("id", id)
      .single();

    if (fetchError || !country) {
      res.status(404).json({ error: "Country not found" });
      return;
    }

    // Guard: countries are referenced by cities and states. Refuse if either
    // still points here so we never orphan/cascade real data unexpectedly.
    const { count: cityCount } = await supabase
      .from("cities")
      .select("id", { count: "exact", head: true })
      .eq("country_id", id);
    if (cityCount && cityCount > 0) {
      res.status(400).json({
        error: `Cannot delete "${country.country_name}": ${cityCount} city/cities still linked. Reassign them first.`,
      });
      return;
    }

    const { count: stateCount } = await supabase
      .from("states")
      .select("id", { count: "exact", head: true })
      .eq("country_id", id);
    if (stateCount && stateCount > 0) {
      res.status(400).json({
        error: `Cannot delete "${country.country_name}": ${stateCount} state(s) still linked. Reassign them first.`,
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from("countries")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete country: ${deleteError.message}`);
    }

    res.status(200).json({
      success: true,
      message: `Country "${country.country_name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting country:", error);
    res.status(500).json({ error: "Failed to delete country" });
  }
}
