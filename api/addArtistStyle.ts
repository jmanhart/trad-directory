import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";

interface AddArtistStyleData {
  artist_id: number;
  style_id: number;
  is_primary?: boolean;
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

    const data: AddArtistStyleData = req.body;
    if (!data.artist_id || !data.style_id) {
      res.status(400).json({
        error: "Missing required fields: artist_id, style_id",
      });
      return;
    }

    // Composite PK (artist_id, style_id) — check for an existing tag.
    const { data: existing } = await supabase
      .from("artist_styles")
      .select("style_id")
      .eq("artist_id", data.artist_id)
      .eq("style_id", data.style_id)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ error: "Artist already has this style" });
      return;
    }

    const { error: insertError } = await supabase.from("artist_styles").insert({
      artist_id: data.artist_id,
      style_id: data.style_id,
      is_primary: !!data.is_primary,
    });

    if (insertError) {
      throw new Error(`Failed to add style: ${insertError.message}`);
    }

    res.status(200).json({ success: true, message: "Style added to artist" });
  } catch (error) {
    console.error("Error adding artist style:", error);
    res.status(500).json({ error: "Failed to add artist style" });
  }
}
