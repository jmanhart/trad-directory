import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";
import type { ApiRequest, ApiResponse } from "./_utils/http";

// Admin action endpoint for the Link Health view. Mutates only the health row
// (link_check_results), never artist/shop data — culling (delete / clear /
// fix handle) is done through the existing artist/shop endpoints.
//
// PUT { entity_type: "artist"|"shop", entity_id: number, action }
//   recheck  - mark due now with a clean slate (status=unknown, streak=0);
//              use after fixing a handle so it re-verifies fresh.
//   ignore   - mute this row (excluded from the queue and the health list).
//   unignore - unmute and mark due now.

interface Parsed {
  entity_type?: string;
  entity_id?: number;
  action?: string;
}

function parseBody(body: unknown): Parsed {
  const out: Parsed = {};
  if (!body || typeof body !== "object") return out;
  if ("entity_type" in body && typeof body.entity_type === "string")
    out.entity_type = body.entity_type;
  if ("entity_id" in body && typeof body.entity_id === "number")
    out.entity_id = body.entity_id;
  if ("action" in body && typeof body.action === "string")
    out.action = body.action;
  return out;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdminAuth(req, res)) return;

  const { entity_type, entity_id, action } = parseBody(req.body);
  if (
    (entity_type !== "artist" && entity_type !== "shop") ||
    typeof entity_id !== "number" ||
    !action
  ) {
    res.status(400).json({ error: "entity_type, entity_id, action required" });
    return;
  }

  const now = new Date().toISOString();
  let patch: Record<string, unknown>;
  if (action === "recheck") {
    patch = { next_check_at: now, status: "unknown", fail_streak: 0, reviewed_at: now };
  } else if (action === "ignore") {
    patch = { ignored: true, reviewed_at: now };
  } else if (action === "unignore") {
    patch = { ignored: false, next_check_at: now, reviewed_at: now };
  } else {
    res.status(400).json({ error: `Unknown action: ${action}` });
    return;
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      res.status(500).json({ error: "Server configuration error" });
      return;
    }
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from("link_check_results")
      .update(patch)
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id);

    if (error) {
      console.error("Supabase error:", error);
      res.status(500).json({ error: "Update failed" });
      return;
    }

    res.status(200).json({ success: true, action });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
