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

    const { data: artist, error: fetchError } = await supabase
      .from("artists")
      .select("id, name")
      .eq("id", id)
      .single();

    if (fetchError || !artist) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }

    // Clean up child rows first (no reliable FK cascade for these).
    await supabase.from("artist_shop").delete().eq("artist_id", id);
    await supabase.from("saved_artists").delete().eq("artist_id", id);
    await supabase.from("artist_location").delete().eq("artist_id", id);

    const { error: deleteError } = await supabase
      .from("artists")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete artist: ${deleteError.message}`);
    }

    res.status(200).json({
      success: true,
      message: `Artist "${artist.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting artist:", error);
    res.status(500).json({ error: "Failed to delete artist" });
  }
}
