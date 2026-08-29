import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Sentry } from "./_utils/sentry";
import { probeInstagram } from "./_utils/instagramProbe";
import { nextState, type LinkStatus } from "./_utils/linkHealth";

export const config = { maxDuration: 300 };

// Pulse tuning. Small waves + jitter keep per-IP volume low; IG rate-limits the
// probe endpoint hard, so we abort a wave and let the next tick retry rather
// than hammer through blocks.
const WAVE_SIZE = 12; // handles probed per cron tick (kept under IG's per-IP throttle)
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 6000;
const PROBE_TIMEOUT_MS = 10000;
const RATE_LIMIT_ABORT = 3; // consecutive rate-limit/timeout unknowns -> stop wave

// Minimal Vercel serverless request/response surface we actually use.
interface CronRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface CronResponse {
  status(code: number): CronResponse;
  json(body: unknown): void;
}

interface HandleRow {
  entity_type: "artist" | "shop";
  entity_id: number;
  entity_name: string;
  instagram_handle: string;
}

interface HealthRow {
  entity_type: string;
  entity_id: number;
  status: LinkStatus;
  fail_streak: number;
  next_check_at: string;
  last_alive_at: string | null;
  ignored: boolean;
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

export default async function handler(req: CronRequest, res: CronResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }
  if (req.headers["authorization"] !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const checkInId = Sentry.captureCheckIn({
    monitorSlug: "instagram-link-checker",
    status: "in_progress",
  });

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      res.status(500).json({ error: "Server configuration error" });
      return;
    }
    const supabase: SupabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // All handles across both entity types.
    const [artistsQ, shopsQ] = await Promise.all([
      supabase
        .from("artists")
        .select("id, name, instagram_handle")
        .not("instagram_handle", "is", null),
      supabase
        .from("tattoo_shops")
        .select("id, shop_name, instagram_handle")
        .not("instagram_handle", "is", null),
    ]);
    if (artistsQ.error) throw artistsQ.error;
    if (shopsQ.error) throw shopsQ.error;

    const handles: HandleRow[] = [];
    for (const a of artistsQ.data ?? []) {
      handles.push({
        entity_type: "artist",
        entity_id: a.id,
        entity_name: a.name,
        instagram_handle: a.instagram_handle,
      });
    }
    for (const s of shopsQ.data ?? []) {
      handles.push({
        entity_type: "shop",
        entity_id: s.id,
        entity_name: s.shop_name,
        instagram_handle: s.instagram_handle,
      });
    }

    // Existing health rows, keyed by "type:id".
    const { data: healthData, error: healthError } = await supabase
      .from("link_check_results")
      .select(
        "entity_type, entity_id, status, fail_streak, next_check_at, last_alive_at, ignored"
      );
    if (healthError) throw healthError;
    // Query columns are fixed above, so the row shape is known.
    const healthRows = (healthData ?? []) as HealthRow[];
    const healthByKey: Record<string, HealthRow> = {};
    for (const r of healthRows) {
      healthByKey[`${r.entity_type}:${r.entity_id}`] = r;
    }

    // Build the due queue: never-checked first, then the most-overdue. Ignored
    // rows are skipped entirely.
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const neverChecked: HandleRow[] = [];
    const due: { row: HandleRow; dueAt: number }[] = [];
    for (const h of handles) {
      const prev = healthByKey[`${h.entity_type}:${h.entity_id}`];
      if (!prev) {
        neverChecked.push(h);
        continue;
      }
      if (prev.ignored) continue;
      const dueAt = new Date(prev.next_check_at).getTime();
      if (dueAt <= now) due.push({ row: h, dueAt });
    }
    due.sort((a, b) => a.dueAt - b.dueAt);
    const wave = [...neverChecked, ...due.map(d => d.row)].slice(0, WAVE_SIZE);

    let alive = 0;
    let dead = 0;
    let unknown = 0;
    let confirmedDead = 0;
    let rateLimitStreak = 0;
    let aborted = false;

    await Sentry.startSpan(
      {
        name: "instagram-link-check-wave",
        op: "cron",
        attributes: { "wave.size": wave.length },
      },
      async span => {
        for (const h of wave) {
          await delay(
            MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
          );

          const probe = await probeInstagram(
            h.instagram_handle,
            PROBE_TIMEOUT_MS
          );
          const prev = healthByKey[`${h.entity_type}:${h.entity_id}`];
          const state = nextState(prev, probe.result, nowIso, now);
          if (state.status !== (prev?.status ?? "unchecked")) {
            const from = prev?.status ?? "unchecked";
            Sentry.logger.warn(
              Sentry.logger
                .fmt`link ${from} → ${state.status}: @${h.instagram_handle}`,
              {
                handle: h.instagram_handle,
                entity_type: h.entity_type,
                entity_id: h.entity_id,
                from,
                to: state.status,
                fail_streak: state.fail_streak,
                status_code: probe.statusCode,
              }
            );
            Sentry.metrics.count("link.transition", 1, {
              attributes: { from, to: state.status },
            });
          }

          if (probe.result === "alive") alive++;
          else if (probe.result === "dead") dead++;
          else unknown++;

          const newlyDead = state.status === "dead" && prev?.status !== "dead";
          if (newlyDead) confirmedDead++;

          const { error: upsertError } = await supabase
            .from("link_check_results")
            .upsert(
              {
                entity_type: h.entity_type,
                entity_id: h.entity_id,
                entity_name: h.entity_name,
                instagram_handle: h.instagram_handle,
                status: state.status,
                fail_streak: state.fail_streak,
                last_alive_at: state.last_alive_at,
                next_check_at: state.next_check_at,
                status_code: probe.statusCode,
                error_message: probe.result === "unknown" ? probe.detail : null,
                is_broken: state.status === "dead", // mirror for legacy readers
                checked_at: nowIso,
              },
              { onConflict: "entity_type,entity_id" }
            );
          if (upsertError) console.error("Upsert error:", upsertError);

          if (newlyDead) {
            Sentry.captureMessage(
              `Instagram link confirmed dead: @${h.instagram_handle} (${h.entity_type}: ${h.entity_name})`,
              { level: "warning" }
            );
          }

          // Circuit breaker: consecutive rate-limit / timeout signals -> back off.
          const rateLimited =
            probe.result === "unknown" &&
            (probe.statusCode === 429 ||
              probe.statusCode === 400 ||
              probe.statusCode === null);
          rateLimitStreak = rateLimited ? rateLimitStreak + 1 : 0;
          if (rateLimitStreak >= RATE_LIMIT_ABORT) {
            aborted = true;
            break;
          }
        }
        span.setAttribute("wave.alive", alive);
        span.setAttribute("wave.dead", dead);
        span.setAttribute("wave.unknown", unknown);
        span.setAttribute("wave.confirmed_dead", confirmedDead);
        span.setAttribute("wave.aborted", aborted);
      }
    );

    const dueRemaining = Math.max(
      neverChecked.length + due.length - wave.length,
      0
    );
    Sentry.metrics.gauge("link_health.due_remaining", dueRemaining);
    Sentry.metrics.count("link_health.wave", 1, {
      attributes: { aborted: String(aborted) },
    });
    Sentry.logger.info(
      Sentry.logger
        .fmt`link-check wave: ${wave.length} probed — ${alive} alive, ${dead} dead, ${unknown} unknown, ${confirmedDead} newly dead${aborted ? " (aborted: rate-limit)" : ""}`,
      {
        waveSize: wave.length,
        alive,
        dead,
        unknown,
        confirmedDead,
        aborted,
        dueRemaining,
        totalHandles: handles.length,
      }
    );

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "instagram-link-checker",
      status: "ok",
    });
    await Sentry.flush(5000);

    res.status(200).json({
      waveSize: wave.length,
      alive,
      dead,
      unknown,
      confirmedDead,
      aborted,
      dueRemaining,
      totalHandles: handles.length,
    });
  } catch (error: unknown) {
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "instagram-link-checker",
      status: "error",
    });
    Sentry.captureException(error);
    await Sentry.flush(5000);
    console.error("Error in checkInstagramLinks:", error);
    res.status(500).json({ error: "Failed to check links" });
  }
}
