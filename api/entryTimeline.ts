import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Entity key -> table name. created_at exists on all four (see
// migrations/add_created_at*.sql). Rows added before those migrations have a
// NULL created_at and are naturally excluded, so this reflects new entries.
const TABLES: Record<string, string> = {
  artists: "artists",
  shops: "tattoo_shops",
  cities: "cities",
  countries: "countries",
};

const PAGE = 1000;
const MAX_PAGES = 20; // safety bound: up to 20k rows per entity in the window

// Minimal shapes for the Vercel serverless handler (no @vercel/node dep).
interface TimelineRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}
interface TimelineResponse {
  setHeader(name: string, value: string): void;
  status(code: number): TimelineResponse;
  json(body: unknown): void;
  end(): void;
}

async function collectCreatedAt(
  supabase: SupabaseClient,
  table: string,
  cutoffIso: string
): Promise<string[]> {
  const out: string[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE;
    const { data, error } = await supabase
      .from(table)
      .select("created_at")
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      // Table missing created_at or any query issue: degrade to empty.
      console.error(`entryTimeline: ${table} query failed`, error.message);
      return out;
    }
    const rows = (data ?? []) as { created_at: string | null }[];
    for (const r of rows) if (r.created_at) out.push(r.created_at);
    if (rows.length < PAGE) break;
  }
  return out;
}

async function countAll(
  supabase: SupabaseClient,
  table: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error(`entryTimeline: ${table} count failed`, error.message);
    return 0;
  }
  return count ?? 0;
}

export default async function handler(
  req: TimelineRequest,
  res: TimelineResponse
) {
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

    // Clamp the window. The client fetches up to 400 days (the year view
    // buckets ~13 months); cap defends against arbitrary query values.
    const rawDays = req.query?.days;
    const rawDay = Array.isArray(rawDays) ? rawDays[0] : rawDays;
    const days = Math.min(Math.max(parseInt(rawDay ?? "", 10) || 90, 1), 400);
    const cutoffIso = new Date(Date.now() - days * 86_400_000).toISOString();

    const keys = Object.keys(TABLES);
    const [lists, totalCounts] = await Promise.all([
      Promise.all(keys.map(k => collectCreatedAt(supabase, TABLES[k], cutoffIso))),
      Promise.all(keys.map(k => countAll(supabase, TABLES[k]))),
    ]);

    const entries: Record<string, string[]> = {};
    const totals: Record<string, number> = {};
    keys.forEach((k, i) => {
      entries[k] = lists[i];
      totals[k] = totalCounts[i];
    });

    res.status(200).json({ days, entries, totals });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
