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

    // Verify the row exists and is not primary
    const { data: row, error: fetchError } = await supabase
      .from("artist_location")
      .select("id, is_primary")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      res.status(404).json({ error: "Artist location not found" });
      return;
    }

    if (row.is_primary) {
      res.status(400).json({
        error: "Cannot delete the primary location",
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from("artist_location")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete location: ${deleteError.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Artist location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting artist location:", error);
    res.status(500).json({
      error: "Failed to delete artist location",
    });
  }
}
