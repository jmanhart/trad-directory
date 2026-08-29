import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";
import type { ApiRequest, ApiResponse } from "./_utils/http";

// Bulk link-health lookup for the data browser: entity id -> {status, dates}.
// Paginates so it isn't capped at PostgREST's 1000-row default (the data set is
// ~1.5k rows). The table reads .status for its pill; the detail flyout reads the
// dates.
interface StatusRow {
  entity_type: string;
  entity_id: number;
  status: string;
  last_alive_at: string | null;
  checked_at: string | null;
  status_code: number | null;
  error_message: string | null;
}

interface StatusRec {
  status: string;
  last_alive_at: string | null;
  checked_at: string | null;
  status_code: number | null;
  error_message: string | null;
}

const PAGE = 1000;

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

    const artists: Record<number, StatusRec> = {};
    const shops: Record<number, StatusRec> = {};

    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("link_check_results")
        .select(
          "entity_type, entity_id, status, last_alive_at, checked_at, status_code, error_message"
        )
        .order("entity_id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.error("Supabase error:", error);
        res.status(500).json({ error: "Database query failed" });
        return;
      }
      // Fixed column list above -> known row shape.
      const rows = (data ?? []) as StatusRow[];
      for (const r of rows) {
        const rec: StatusRec = {
          status: r.status,
          last_alive_at: r.last_alive_at,
          checked_at: r.checked_at,
          status_code: r.status_code,
          error_message: r.error_message,
        };
        if (r.entity_type === "artist") artists[r.entity_id] = rec;
        else if (r.entity_type === "shop") shops[r.entity_id] = rec;
      }
      if (rows.length < PAGE) break;
    }

    res.status(200).json({ artists, shops });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
