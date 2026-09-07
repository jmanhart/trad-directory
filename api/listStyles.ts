import { createClient } from "@supabase/supabase-js";

// Public: the styles catalog (+ their category) for pickers and filtering.
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

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

    const { data, error } = await supabase
      .from("styles")
      .select(
        `
        id,
        name,
        slug,
        is_active,
        sort_order,
        category: style_categories (id, name, slug)
      `
      )
      .order("sort_order")
      .order("name");

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({ error: "Database query failed" });
      return;
    }

    res.status(200).json({ styles: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
