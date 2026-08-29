import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";
import type { ApiRequest, ApiResponse } from "./_utils/http";

// Admin read endpoint for the Link Health view. Returns link_check_results
// rows filtered by status. ?status=dead,suspect (default) | all | any subset of
// alive|suspect|dead|unknown. Ignored rows are excluded.
const ALLOWED_STATUS: Record<string, true> = {
  alive: true,
  suspect: true,
  dead: true,
  unknown: true,
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdminAuth(req, res)) return;

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      res.status(500).json({ error: "Server configuration error" });
      return;
    }
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const rawStatus = req.query?.status;
    const param = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
    let statuses: string[];
    if (!param || param === "default") statuses = ["dead", "suspect"];
    else if (param === "all") statuses = ["alive", "suspect", "dead", "unknown"];
    else statuses = param.split(",").filter(s => ALLOWED_STATUS[s]);
    if (statuses.length === 0) statuses = ["dead", "suspect"];

    const { data, error } = await supabase
      .from("link_check_results")
      .select("*")
      .in("status", statuses)
      .eq("ignored", false)
      .order("checked_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({ error: "Database query failed" });
      return;
    }

    res.status(200).json({ rows: data || [], statuses });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
