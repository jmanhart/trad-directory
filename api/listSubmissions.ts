import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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

    // Get optional filter for submission_type
    const { type } = req.query;

    // Build query
    let query = supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by type if provided
    if (type && (type === "report" || type === "new_artist")) {
      query = query.eq("submission_type", type);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({
        error: "Database query failed",
        details: error.message,
      });
      return;
    }

    res.status(200).json({ submissions: submissions || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
}
