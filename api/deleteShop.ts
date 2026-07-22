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

    const { data: shop, error: fetchError } = await supabase
      .from("tattoo_shops")
      .select("id, shop_name")
      .eq("id", id)
      .single();

    if (fetchError || !shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    // Count and remove artist links. artist_location.shop_id auto-nulls via its
    // ON DELETE SET NULL foreign key, so only artist_shop needs cleanup.
    const { count: linkCount } = await supabase
      .from("artist_shop")
      .select("shop_id", { count: "exact", head: true })
      .eq("shop_id", id);
    await supabase.from("artist_shop").delete().eq("shop_id", id);

    const { error: deleteError } = await supabase
      .from("tattoo_shops")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete shop: ${deleteError.message}`);
    }

    res.status(200).json({
      success: true,
      message: `Shop "${shop.shop_name}" deleted${
        linkCount ? ` (unlinked ${linkCount} artist(s))` : ""
      }`,
    });
  } catch (error) {
    console.error("Error deleting shop:", error);
    res.status(500).json({ error: "Failed to delete shop" });
  }
}
