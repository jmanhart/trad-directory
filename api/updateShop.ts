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
      res.status(400).json({ error: "Shop ID is required" });
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

    if (data.shop_name !== undefined) updateData.shop_name = data.shop_name;
    if (data.instagram_handle !== undefined) {
      updateData.instagram_handle = data.instagram_handle
        ? data.instagram_handle.replace(/^@/, "")
        : null;
    }
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.contact !== undefined) updateData.contact = data.contact || null;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number || null;
    if (data.website_url !== undefined) updateData.website_url = data.website_url || null;
    if (data.city_id !== undefined) updateData.city_id = data.city_id || null;

    // Update the shop
    const { data: updatedShop, error: updateError } = await supabase
      .from("tattoo_shops")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase error updating shop:", updateError);
      res.status(500).json({
        error: "Database update failed",
        details: updateError.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      shop_id: id,
      message: `Shop "${data.shop_name || updatedShop.shop_name}" updated successfully`,
    });
  } catch (error) {
    console.error("Error updating shop:", error);
    res.status(500).json({
      error: "Failed to update shop",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
