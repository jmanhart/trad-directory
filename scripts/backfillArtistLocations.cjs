/**
 * Backfill artist_location rows for artists that have a city_id
 * but no corresponding entry in the artist_location table.
 *
 * Usage:
 *   node scripts/backfillArtistLocations.cjs          # Dry run (list only)
 *   node scripts/backfillArtistLocations.cjs --fix     # Actually insert rows
 */
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const FIX = process.argv.includes("--fix");

async function main() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Get all artists
  const { data: allArtists, error: aErr } = await supabase
    .from("artists")
    .select("id, name, city_id")
    .order("id");
  if (aErr) throw new Error("Failed to fetch artists: " + aErr.message);

  // Get all existing artist_location entries
  const { data: allLocs, error: lErr } = await supabase
    .from("artist_location")
    .select("artist_id");
  if (lErr) throw new Error("Failed to fetch locations: " + lErr.message);

  const locSet = new Set(allLocs.map((l) => l.artist_id));

  // Find orphans with a city_id
  const orphansWithCity = allArtists.filter(
    (a) => !locSet.has(a.id) && a.city_id != null
  );
  const orphansNoCity = allArtists.filter(
    (a) => !locSet.has(a.id) && a.city_id == null
  );

  console.log("Artists missing artist_location entry:");
  console.log("  With city_id (fixable):    " + orphansWithCity.length);
  console.log("  Without city_id (manual):  " + orphansNoCity.length);

  if (orphansNoCity.length > 0) {
    console.log("\nArtists needing manual city assignment:");
    orphansNoCity.forEach((a) =>
      console.log("  - " + a.name + " (id: " + a.id + ")")
    );
  }

  if (orphansWithCity.length === 0) {
    console.log("\nNothing to backfill!");
    return;
  }

  console.log("\nOrphans to backfill:");
  orphansWithCity.forEach((a) =>
    console.log(
      "  " + a.id + " | " + a.name + " | city_id=" + a.city_id
    )
  );

  if (!FIX) {
    console.log("\nDry run complete. Run with --fix to insert rows.");
    return;
  }

  // Insert in batches of 50
  const BATCH = 50;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < orphansWithCity.length; i += BATCH) {
    const batch = orphansWithCity.slice(i, i + BATCH);
    const rows = batch.map((a) => ({
      artist_id: a.id,
      city_id: a.city_id,
      is_primary: true,
    }));

    const { error } = await supabase.from("artist_location").insert(rows);

    if (error) {
      console.error("Batch insert failed at offset " + i + ": " + error.message);
      // Fall back to individual inserts
      for (const row of rows) {
        const { error: singleErr } = await supabase
          .from("artist_location")
          .insert(row);
        if (singleErr) {
          console.error(
            "  FAILED artist " + row.artist_id + ": " + singleErr.message
          );
          failed++;
        } else {
          success++;
        }
      }
    } else {
      success += batch.length;
      console.log(
        "Inserted batch " +
          (Math.floor(i / BATCH) + 1) +
          " (" +
          batch.length +
          " rows)"
      );
    }
  }

  console.log("\nDone! Inserted: " + success + ", Failed: " + failed);
}

main().catch(console.error);
