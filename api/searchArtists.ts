import { createClient } from "@supabase/supabase-js";
import { Artist } from "./types";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ error: "Query parameter is required" });
      return;
    }

    // Search for artists in Supabase
    const { data: artists, error } = await supabase
      .from("artists")
      .select("id, name, insta, location")
      .ilike("name", `%${query}%`)
      .limit(50);

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({ error: "Database query failed" });
      return;
    }

    const results: Artist[] = artists || [];

    res.status(200).json({
      results,
      count: results.length,
      query,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
