import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Find artists with no artist_location row
  const { data: allArtists, error: aErr } = await supabase
    .from("artists")
    .select("id, name, city_id")
    .order("id");

  if (aErr) {
    console.error("Error fetching artists:", aErr);
    process.exit(1);
  }

  const { data: allLocs, error: lErr } = await supabase
    .from("artist_location")
    .select("artist_id");

  if (lErr) {
    console.error("Error fetching artist_location:", lErr);
    process.exit(1);
  }

  const linkedArtistIds = new Set(allLocs.map(l => l.artist_id));
  const orphans = allArtists.filter(a => !linkedArtistIds.has(a.id));

  if (orphans.length === 0) {
    console.log("No orphan artists found. All good!");
    return;
  }

  console.log(`Found ${orphans.length} artists without artist_location rows.\n`);

  // 2. Get artist_shop links for orphans
  const orphanIds = orphans.map(a => a.id);
  const { data: shopLinks, error: sErr } = await supabase
    .from("artist_shop")
    .select("artist_id, shop_id")
    .in("artist_id", orphanIds);

  if (sErr) {
    console.error("Error fetching artist_shop:", sErr);
    process.exit(1);
  }

  const shopByArtist = new Map();
  (shopLinks || []).forEach(sl => {
    if (!shopByArtist.has(sl.artist_id)) {
      shopByArtist.set(sl.artist_id, []);
    }
    shopByArtist.get(sl.artist_id).push(sl.shop_id);
  });

  // 3. Build artist_location rows
  const rows = [];
  const skipped = [];

  for (const artist of orphans) {
    if (!artist.city_id) {
      skipped.push(artist);
      continue;
    }

    const shops = shopByArtist.get(artist.id) || [null];
    // Create one row per shop (or one with null shop if no shops)
    for (const shopId of shops) {
      const row = {
        artist_id: artist.id,
        city_id: artist.city_id,
        is_primary: true,
      };
      if (shopId) row.shop_id = shopId;
      rows.push(row);
    }
  }

  if (skipped.length > 0) {
    console.log(`Skipping ${skipped.length} artists with no city_id:`);
    skipped.forEach(a => console.log(`  ID ${a.id} | ${a.name}`));
    console.log();
  }

  if (rows.length === 0) {
    console.log("No rows to insert.");
    return;
  }

  console.log(`Inserting ${rows.length} artist_location rows...`);
  rows.forEach(r =>
    console.log(`  artist_id=${r.artist_id} city_id=${r.city_id} shop_id=${r.shop_id || "null"}`)
  );

  const { error: insertErr } = await supabase
    .from("artist_location")
    .insert(rows);

  if (insertErr) {
    console.error("\nInsert error:", insertErr.message);
    process.exit(1);
  }

  console.log(`\nDone! Inserted ${rows.length} artist_location rows.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
