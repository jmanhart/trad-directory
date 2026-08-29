import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";
import { Sentry } from "./_utils/sentry";
import { probeInstagram } from "./_utils/instagramProbe";
import { nextState, type LinkStatus } from "./_utils/linkHealth";
import type { ApiRequest, ApiResponse } from "./_utils/http";

// On-demand single link check for the Link Health view's "Check Link" action.
// Probes Instagram live, applies the same state machine as the cron, upserts,
// and returns BOTH the stored status and the raw probe result so the UI can
// show exactly what IG said.
//
// PUT { entity_type: "artist"|"shop", entity_id: number }

interface Parsed {
  entity_type?: "artist" | "shop";
  entity_id?: number;
}

function parseBody(body: unknown): Parsed {
  const out: Parsed = {};
  if (!body || typeof body !== "object") return out;
  if (
    "entity_type" in body &&
    (body.entity_type === "artist" || body.entity_type === "shop")
  )
    out.entity_type = body.entity_type;
  if ("entity_id" in body && typeof body.entity_id === "number")
    out.entity_id = body.entity_id;
  return out;
}

interface PrevRow {
  status: LinkStatus;
  fail_streak: number;
  last_alive_at: string | null;
  entity_name: string | null;
}

function readPrev(rows: unknown): PrevRow | undefined {
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const r = rows[0];
  if (!r || typeof r !== "object") return undefined;
  const status =
    "status" in r && typeof r.status === "string" ? r.status : "unchecked";
  const fail_streak =
    "fail_streak" in r && typeof r.fail_streak === "number" ? r.fail_streak : 0;
  const last_alive_at =
    "last_alive_at" in r && typeof r.last_alive_at === "string"
      ? r.last_alive_at
      : null;
  const entity_name =
    "entity_name" in r && typeof r.entity_name === "string"
      ? r.entity_name
      : null;
  return {
    status: status as LinkStatus,
    fail_streak,
    last_alive_at,
    entity_name,
  };
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

  const { entity_type, entity_id } = parseBody(req.body);
  if (!entity_type || typeof entity_id !== "number") {
    res.status(400).json({ error: "entity_type and entity_id required" });
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

    // Resolve the current handle from the source table.
    const table = entity_type === "artist" ? "artists" : "tattoo_shops";
    const nameCol = entity_type === "artist" ? "name" : "shop_name";
    const { data: entityRows, error: entityError } = await supabase
      .from(table)
      .select(`instagram_handle, ${nameCol}`)
      .eq("id", entity_id)
      .limit(1);
    if (entityError) throw entityError;
    const entity = Array.isArray(entityRows) ? entityRows[0] : null;
    const handle =
      entity && typeof entity === "object" && "instagram_handle" in entity
        ? entity.instagram_handle
        : null;
    if (!handle || typeof handle !== "string") {
      res.status(404).json({ error: "No Instagram handle for this entity" });
      return;
    }
    const nameFromEntity =
      entity && typeof entity === "object" && nameCol in entity
        ? entity[nameCol]
        : null;

    // Prior health row (for the streak).
    const { data: prevRows, error: prevError } = await supabase
      .from("link_check_results")
      .select("status, fail_streak, last_alive_at, entity_name")
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id)
      .limit(1);
    if (prevError) throw prevError;
    const prev = readPrev(prevRows);

    // Live probe + transition.
    const { probe, state, nowIso } = await Sentry.startSpan(
      {
        name: "link.check.ondemand",
        op: "function",
        attributes: { entity_type, entity_id, "ig.handle": handle },
      },
      async () => {
        const probe = await probeInstagram(handle, 10000, 2);
        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        const state = nextState(prev, probe.result, nowIso, now);

        const { error: upsertError } = await supabase
          .from("link_check_results")
          .upsert(
            {
              entity_type,
              entity_id,
              entity_name:
                (typeof nameFromEntity === "string" ? nameFromEntity : null) ??
                prev?.entity_name ??
                null,
              instagram_handle: handle,
              status: state.status,
              fail_streak: state.fail_streak,
              last_alive_at: state.last_alive_at,
              next_check_at: state.next_check_at,
              status_code: probe.statusCode,
              error_message: probe.result === "unknown" ? probe.detail : null,
              is_broken: state.status === "dead",
              checked_at: nowIso,
            },
            { onConflict: "entity_type,entity_id" }
          );
        if (upsertError) throw upsertError;
        return { probe, state, nowIso };
      }
    );

    if (state.status !== (prev?.status ?? "unchecked")) {
      const from = prev?.status ?? "unchecked";
      Sentry.logger.info(
        Sentry.logger.fmt`check-link ${from} → ${state.status}: @${handle}`,
        {
          handle,
          entity_type,
          entity_id,
          from,
          to: state.status,
          status_code: probe.statusCode,
        }
      );
    }
    Sentry.metrics.count("link.check.ondemand", 1, {
      attributes: { result: probe.result, status: state.status },
    });
    await Sentry.flush(2000);

    res.status(200).json({
      status: state.status,
      probe: {
        result: probe.result,
        statusCode: probe.statusCode,
        detail: probe.detail,
      },
      checked_at: nowIso,
      last_alive_at: state.last_alive_at,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { endpoint: "checkLink" },
      extra: { entity_type, entity_id },
    });
    await Sentry.flush(2000);
    console.error("checkLink error:", error);
    res.status(500).json({ error: "Check failed" });
  }
}
