import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow PUT requests
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { id, ...data } = req.body;

    if (!id) {
      res.status(400).json({ error: "Artist ID is required" });
      return;
    }

    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Prepare update data
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.instagram_handle !== undefined) {
      updateData.instagram_handle = data.instagram_handle
        ? data.instagram_handle.replace(/^@/, "")
        : null;
    }
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.contact !== undefined) updateData.contact = data.contact || null;
    if (data.city_id !== undefined) updateData.city_id = data.city_id || null;
    if (data.is_traveling !== undefined) updateData.is_traveling = data.is_traveling || false;

    // Update the artist
    const { data: updatedArtist, error: updateError } = await supabase
      .from("artists")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase error updating artist:", updateError);
      res.status(500).json({
        error: "Database update failed",
      });
      return;
    }

    // Handle shop relationship update
    if (data.shop_id !== undefined) {
      // First, delete existing shop links
      await supabase.from("artist_shop").delete().eq("artist_id", id);

      // Then add new shop link if provided
      if (data.shop_id) {
        const { error: shopError } = await supabase.from("artist_shop").insert({
          artist_id: id,
          shop_id: data.shop_id,
        });

        if (shopError) {
          console.warn(`Failed to update artist-shop link: ${shopError.message}`);
          // Don't fail the whole request - artist was updated successfully
        }
      }
    }

    // Dual-write: update artist_location primary row when city_id or shop_id changes
    if (data.city_id !== undefined || data.shop_id !== undefined) {
      const locUpdate: any = {};
      if (data.city_id !== undefined) locUpdate.city_id = data.city_id || null;
      if (data.shop_id !== undefined) locUpdate.shop_id = data.shop_id || null;

      // Try to update the existing primary row
      const { data: existingLoc } = await supabase
        .from("artist_location")
        .select("id")
        .eq("artist_id", id)
        .eq("is_primary", true)
        .maybeSingle();

      if (existingLoc) {
        const { error: locError } = await supabase
          .from("artist_location")
          .update(locUpdate)
          .eq("id", existingLoc.id);

        if (locError) {
          console.warn(`Failed to update artist_location: ${locError.message}`);
        }
      } else {
        // No primary row exists yet — insert one
        const { error: locError } = await supabase
          .from("artist_location")
          .insert({
            artist_id: id,
            city_id: data.city_id || updatedArtist.city_id || null,
            shop_id: data.shop_id || null,
            is_primary: true,
          });

        if (locError) {
          console.warn(`Failed to insert artist_location: ${locError.message}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      artist_id: id,
      message: `Artist "${data.name || updatedArtist.name}" updated successfully`,
    });
  } catch (error) {
    console.error("Error updating artist:", error);
    res.status(500).json({
      error: "Failed to update artist",
    });
  }
}
