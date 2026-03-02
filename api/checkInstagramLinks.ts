import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/node";

export const config = { maxDuration: 300 };

const BATCH_SIZE = 50;
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 5000;
const FETCH_TIMEOUT_MS = 10000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
});

interface HandleRow {
  entity_type: "artist" | "shop";
  entity_id: number;
  entity_name: string;
  instagram_handle: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

export default async function handler(req: any, res: any) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify CRON_SECRET auth
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET env var not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: "instagram-link-checker", status: "in_progress" },
    {
      schedule: { type: "crontab", value: "*/15 2-6 * * *" },
      checkinMargin: 5,
      maxRuntime: 10,
      timezone: "Etc/UTC",
    }
  );

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

    // Read current cursor offset
    const { data: cursorData, error: cursorError } = await supabase
      .from("link_check_cursor")
      .select("current_offset")
      .eq("id", 1)
      .single();

    if (cursorError) {
      console.error("Error reading cursor:", cursorError);
      res.status(500).json({ error: "Failed to read cursor" });
      return;
    }

    const currentOffset = cursorData?.current_offset ?? 0;

    // Fetch all handles as a combined ordered list: artists first, then shops
    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .select("id, name, instagram_handle")
      .not("instagram_handle", "is", null)
      .order("id", { ascending: true });

    if (artistError) {
      console.error("Error fetching artists:", artistError);
      res.status(500).json({ error: "Failed to fetch artists" });
      return;
    }

    const { data: shopData, error: shopError } = await supabase
      .from("tattoo_shops")
      .select("id, shop_name, instagram_handle")
      .not("instagram_handle", "is", null)
      .order("id", { ascending: true });

    if (shopError) {
      console.error("Error fetching shops:", shopError);
      res.status(500).json({ error: "Failed to fetch shops" });
      return;
    }

    // Build unified ordered list
    const allHandles: HandleRow[] = [];

    for (const artist of artistData || []) {
      allHandles.push({
        entity_type: "artist",
        entity_id: artist.id,
        entity_name: artist.name,
        instagram_handle: artist.instagram_handle,
      });
    }

    for (const shop of shopData || []) {
      allHandles.push({
        entity_type: "shop",
        entity_id: shop.id,
        entity_name: shop.shop_name,
        instagram_handle: shop.instagram_handle,
      });
    }

    const totalHandles = allHandles.length;

    // If no handles exist, nothing to do
    if (totalHandles === 0) {
      res.status(200).json({
        checked: 0,
        broken: 0,
        nextOffset: 0,
        cycleComplete: true,
      });
      return;
    }

    // Determine the batch slice
    const effectiveOffset = currentOffset >= totalHandles ? 0 : currentOffset;
    const batch = allHandles.slice(
      effectiveOffset,
      effectiveOffset + BATCH_SIZE
    );
    const cycleComplete = effectiveOffset + batch.length >= totalHandles;
    const nextOffset = cycleComplete ? 0 : effectiveOffset + batch.length;

    let brokenCount = 0;

    // Check each handle in the batch
    for (const handle of batch) {
      const url = `https://www.instagram.com/${handle.instagram_handle}`;

      let statusCode: number | null = null;
      let errorMessage: string | null = null;
      let isBroken = false;

      try {
        await delay(randomDelay());

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          FETCH_TIMEOUT_MS
        );

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          redirect: "manual",
        });

        clearTimeout(timeoutId);
        statusCode = response.status;

        // Instagram redirects all unauthenticated profile views to /accounts/login/
        // A 302 redirect means Instagram recognizes the URL — the profile likely exists.
        // Only a 404 reliably indicates the profile doesn't exist / handle changed.
        // A 429 is rate limiting, not a broken link.
        if (response.status === 404) {
          isBroken = true;
        }
      } catch (error: any) {
        isBroken = true;
        errorMessage = error.message || "Unreachable";
      }

      // Upsert result into link_check_results
      const { error: upsertError } = await supabase
        .from("link_check_results")
        .upsert(
          {
            entity_type: handle.entity_type,
            entity_id: handle.entity_id,
            entity_name: handle.entity_name,
            instagram_handle: handle.instagram_handle,
            status_code: statusCode,
            error_message: errorMessage,
            is_broken: isBroken,
            checked_at: new Date().toISOString(),
          },
          { onConflict: "entity_type,entity_id" }
        );

      if (upsertError) {
        console.error("Upsert error:", upsertError);
      }

      if (isBroken) {
        brokenCount++;
        Sentry.captureMessage(
          `Broken Instagram link: @${handle.instagram_handle} (${handle.entity_type}: ${handle.entity_name})`,
          {
            level: "warning",
            tags: {
              entity_type: handle.entity_type,
              entity_id: String(handle.entity_id),
              instagram_handle: handle.instagram_handle,
            },
            extra: {
              entity_name: handle.entity_name,
              status_code: statusCode,
              error_message: errorMessage,
              url,
            },
          }
        );
      }
    }

    // Update cursor
    const { error: updateCursorError } = await supabase
      .from("link_check_cursor")
      .update({
        current_offset: nextOffset,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (updateCursorError) {
      console.error("Error updating cursor:", updateCursorError);
    }

    Sentry.captureCheckIn({ checkInId, monitorSlug: "instagram-link-checker", status: "ok" });
    await Sentry.flush(5000);

    res.status(200).json({
      checked: batch.length,
      broken: brokenCount,
      nextOffset,
      cycleComplete,
      totalHandles,
    });
  } catch (error: any) {
    Sentry.captureCheckIn({ checkInId, monitorSlug: "instagram-link-checker", status: "error" });
    Sentry.captureException(error);
    await Sentry.flush(5000);
    console.error("Error in checkInstagramLinks:", error);
    res.status(500).json({
      error: "Failed to check links",
    });
  }
}
