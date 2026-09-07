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

    const { artist_id, style_id } = req.body;
    if (!artist_id || !style_id) {
      res.status(400).json({
        error: "Missing required fields: artist_id, style_id",
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from("artist_styles")
      .delete()
      .eq("artist_id", artist_id)
      .eq("style_id", style_id);

    if (deleteError) {
      throw new Error(`Failed to remove style: ${deleteError.message}`);
    }

    res.status(200).json({ success: true, message: "Style removed from artist" });
  } catch (error) {
    console.error("Error deleting artist style:", error);
    res.status(500).json({ error: "Failed to delete artist style" });
  }
}
