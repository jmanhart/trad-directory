import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 5000;
const FETCH_TIMEOUT_MS = 10000;

// --- Env setup ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const supabaseVars = Object.keys(process.env).filter((k) =>
    k.includes("SUPABASE")
  );
  console.error("\n=== Missing Supabase env vars ===");
  console.error(
    "Available env vars with 'SUPABASE':",
    supabaseVars.length > 0 ? supabaseVars : "NONE FOUND"
  );
  console.error(
    "Need SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)"
  );
  console.error("=================================\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- CLI args ---
const batchArg = process.argv[2];
const checkAll = batchArg === "all";
const batchSize = checkAll ? Infinity : parseInt(batchArg, 10) || 50;

// --- Helpers ---
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

// --- Main ---
async function main() {
  console.log(`\nInstagram Link Checker (local)`);
  console.log(`Batch size: ${checkAll ? "all" : batchSize}\n`);

  // Read cursor
  const { data: cursorData, error: cursorError } = await supabase
    .from("link_check_cursor")
    .select("current_offset")
    .eq("id", 1)
    .single();

  if (cursorError) {
    console.error("Error reading cursor:", cursorError.message);
    process.exit(1);
  }

  const currentOffset = cursorData?.current_offset ?? 0;
  console.log(`Current cursor offset: ${currentOffset}`);

  // Fetch all handles
  const { data: artistData, error: artistError } = await supabase
    .from("artists")
    .select("id, name, instagram_handle")
    .not("instagram_handle", "is", null)
    .order("id", { ascending: true });

  if (artistError) {
    console.error("Error fetching artists:", artistError.message);
    process.exit(1);
  }

  const { data: shopData, error: shopError } = await supabase
    .from("tattoo_shops")
    .select("id, shop_name, instagram_handle")
    .not("instagram_handle", "is", null)
    .order("id", { ascending: true });

  if (shopError) {
    console.error("Error fetching shops:", shopError.message);
    process.exit(1);
  }

  // Build unified list
  const allHandles = [];

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
  console.log(`Total handles: ${totalHandles}`);

  if (totalHandles === 0) {
    console.log("No handles to check.");
    return;
  }

  // Determine batch slice
  const effectiveOffset = currentOffset >= totalHandles ? 0 : currentOffset;
  const effectiveBatchSize = checkAll
    ? totalHandles - effectiveOffset
    : batchSize;
  const batch = allHandles.slice(
    effectiveOffset,
    effectiveOffset + effectiveBatchSize
  );
  const cycleComplete = effectiveOffset + batch.length >= totalHandles;
  const nextOffset = cycleComplete ? 0 : effectiveOffset + batch.length;

  console.log(
    `Checking ${batch.length} handles (offset ${effectiveOffset}–${effectiveOffset + batch.length - 1})\n`
  );

  let brokenCount = 0;
  let okCount = 0;

  // Check each handle
  for (let i = 0; i < batch.length; i++) {
    const handle = batch[i];
    const url = `https://www.instagram.com/${handle.instagram_handle}`;

    let statusCode = null;
    let errorMessage = null;
    let isBroken = false;

    try {
      await delay(randomDelay());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);
      statusCode = response.status;

      if (response.status !== 200) {
        isBroken = true;
      }
    } catch (error) {
      isBroken = true;
      errorMessage = error.message || "Unreachable";
    }

    // Print progress
    const status = isBroken
      ? `BROKEN (${statusCode ?? errorMessage})`
      : `OK (${statusCode})`;
    console.log(
      `  [${i + 1}/${batch.length}] @${handle.instagram_handle} (${handle.entity_type}: ${handle.entity_name}) — ${status}`
    );

    if (isBroken) brokenCount++;
    else okCount++;

    // Upsert result
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
      console.error(`    Upsert error: ${upsertError.message}`);
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
    console.error("Error updating cursor:", updateCursorError.message);
  }

  // Summary
  console.log(`\n--- Summary ---`);
  console.log(`Checked: ${batch.length}`);
  console.log(`OK:      ${okCount}`);
  console.log(`Broken:  ${brokenCount}`);
  console.log(`Next offset: ${nextOffset}${cycleComplete ? " (cycle complete)" : ""}`);
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
