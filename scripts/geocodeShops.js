import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Backfill latitude/longitude for tattoo shops from their street address.
 *
 * Mirrors scripts/geocodeCities.js but geocodes the full shop `address`
 * (Nominatim), appending city/state/country context so partial or
 * international addresses still resolve. Shops that already have coordinates
 * or have no address are skipped. Re-runnable: only touches rows still
 * missing coordinates.
 *
 * Usage:
 *   node scripts/geocodeShops.js          # DRY RUN — list what would change, no writes
 *   node scripts/geocodeShops.js --fix    # actually write latitude/longitude
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_KEY in the environment (writes
 * bypass RLS). Run with the prod env sourced, e.g.:
 *   set -a; source .vercel/.env.development.local; set +a; node scripts/geocodeShops.js
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100; // Nominatim requires >= 1s between requests

const FIX = process.argv.includes("--fix");

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase env vars (need SUPABASE_URL + a key). Source .vercel/.env.development.local first."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Geocode a full street address, appending city/state/country context when the
// address doesn't already include the city (mirrors api/_utils/geocode.ts).
async function geocodeAddress(address, cityName, stateName, countryName) {
  const addr = (address || "").trim();
  if (!addr) return null;

  const context = [cityName, stateName, countryName].filter(Boolean).join(", ");
  const hasCity =
    !!cityName && addr.toLowerCase().includes(cityName.toLowerCase());
  const query = context && !hasCity ? `${addr}, ${context}` : addr;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "TradDirectory/1.0 (geocoding shop addresses for tattoo directory)",
    },
  });
  if (!res.ok) {
    console.log(`  HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function pickOne(v) {
  return Array.isArray(v) ? v[0] : v;
}

async function main() {
  console.log(
    FIX
      ? "MODE: --fix (writing latitude/longitude to prod)\n"
      : "MODE: dry run (no writes; pass --fix to apply)\n"
  );

  const { data: shops, error } = await supabase
    .from("tattoo_shops")
    .select(
      "id, shop_name, address, latitude, city:cities(city_name, state:states(state_name, country:countries(country_name)))"
    )
    .is("latitude", null)
    .not("address", "is", null)
    .order("id");

  if (error) {
    console.error("Error fetching shops:", error);
    process.exit(1);
  }

  const targets = (shops || []).filter(s => (s.address || "").trim());
  if (targets.length === 0) {
    console.log("No shops with an address are missing coordinates. Done.");
    return;
  }

  console.log(`${targets.length} shop(s) with an address need coordinates.\n`);

  let success = 0;
  let notFound = 0;
  let failed = 0;

  for (const shop of targets) {
    const city = pickOne(shop.city);
    const state = pickOne(city?.state);
    const country = pickOne(state?.country);
    const cityName = city?.city_name || null;
    const stateName = state?.state_name || null;
    const countryName = country?.country_name || null;

    process.stdout.write(
      `#${shop.id} ${shop.shop_name} — "${shop.address.replace(/\s+/g, " ").trim()}" ... `
    );

    const result = await geocodeAddress(
      shop.address,
      cityName,
      stateName,
      countryName
    );

    if (!result) {
      console.log("NOT FOUND");
      notFound++;
      await sleep(DELAY_MS);
      continue;
    }

    if (!FIX) {
      console.log(`would set (${result.lat}, ${result.lng})`);
      success++;
      await sleep(DELAY_MS);
      continue;
    }

    const { error: updateError } = await supabase
      .from("tattoo_shops")
      .update({ latitude: result.lat, longitude: result.lng })
      .eq("id", shop.id);

    if (updateError) {
      console.log(`DB ERROR: ${updateError.message}`);
      failed++;
    } else {
      console.log(`OK (${result.lat}, ${result.lng})`);
      success++;
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\nDone. ${success} ${FIX ? "geocoded" : "resolvable"}, ${notFound} not found${
      FIX ? `, ${failed} db errors` : ""
    }.`
  );
  if (!FIX && success > 0) {
    console.log("\nRe-run with --fix (after `npm run backup`) to write these.");
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
