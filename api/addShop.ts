import { createClient } from "@supabase/supabase-js";

interface AddShopData {
  shop_name: string;
  instagram_handle?: string;
  address?: string;
  contact?: string;
  phone_number?: string;
  website_url?: string;
  city_id: number;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Initialize Supabase client with service key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Validate request body
    const data: AddShopData = req.body;
    if (!data.shop_name || !data.city_id) {
      res.status(400).json({
        error: "Missing required fields: shop_name, city_id",
      });
      return;
    }

    // Generate slug for the shop
    // First, generate base slug
    const baseSlug = data.shop_name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);

    // Check if slug already exists
    const { data: existingShop } = await supabase
      .from("tattoo_shops")
      .select("id")
      .eq("slug", baseSlug)
      .single();

    // Create the shop
    const shopData: any = {
      shop_name: data.shop_name,
      city_id: data.city_id,
      // Slug will be set after insert if needed
    };

    if (data.instagram_handle) {
      shopData.instagram_handle = data.instagram_handle.replace(/^@/, "");
    }

    if (data.address) {
      shopData.address = data.address;
    }

    if (data.contact) {
      shopData.contact = data.contact;
    }

    if (data.phone_number) {
      shopData.phone_number = data.phone_number;
    }

    if (data.website_url) {
      shopData.website_url = data.website_url;
    }

    const { data: newShop, error: shopError } = await supabase
      .from("tattoo_shops")
      .insert(shopData)
      .select("id")
      .single();

    if (shopError || !newShop) {
      throw new Error(
        `Failed to create shop: ${shopError?.message || "Unknown error"}`
      );
    }

    // Set slug (append ID if duplicate exists)
    const finalSlug = existingShop ? `${baseSlug}-${newShop.id}` : baseSlug;
    const { error: slugError } = await supabase
      .from("tattoo_shops")
      .update({ slug: finalSlug })
      .eq("id", newShop.id);

    if (slugError) {
      console.warn(`Failed to set slug for shop: ${slugError.message}`);
      // Don't throw - the shop was created successfully, just the slug failed
    }

    res.status(200).json({
      success: true,
      shop_id: newShop.id,
      message: `Shop "${data.shop_name}" added successfully`,
    });
  } catch (error) {
    console.error("Error adding shop:", error);
    res.status(500).json({
      error: "Failed to add shop",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
