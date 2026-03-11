/**
 * Fix artists with missing city_id / artist_location entries.
 *
 * Usage:
 *   node scripts/fixMissingLocations.js                  # list artists missing location
 *   node scripts/fixMissingLocations.js --fix            # interactive: prompt for each artist
 *   node scripts/fixMissingLocations.js --fix --artist 123  # fix a specific artist by ID
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_ variants) in env or .env
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

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

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function geocodeCity(cityName, stateName, countryName) {
  const parts = [cityName, stateName, countryName].filter(Boolean);
  const query = parts.join(", ");

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "TradDirectory/1.0 (geocoding cities for tattoo artist directory)",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

async function getOrCreateCountry(countryName) {
  const { data: existing } = await supabase
    .from("countries")
    .select("id")
    .eq("country_name", countryName)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("countries")
    .insert({ country_name: countryName })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create country: ${error.message}`);
  return created.id;
}

async function getOrCreateState(stateName, countryId) {
  const { data: existing } = await supabase
    .from("states")
    .select("id")
    .eq("state_name", stateName)
    .eq("country_id", countryId)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("states")
    .insert({ state_name: stateName, country_id: countryId })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create state: ${error.message}`);
  return created.id;
}

async function getOrCreateCity(cityName, stateId, countryId) {
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("city_name", cityName)
    .eq("state_id", stateId)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("cities")
    .insert({ city_name: cityName, state_id: stateId, country_id: countryId })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create city: ${error.message}`);
  return created.id;
}

async function getMissingArtists(artistId) {
  const selectFields =
    "id, name, instagram_handle, city_id, url, contact, is_traveling, created_at";

  let query = supabase
    .from("artists")
    .select(selectFields)
    .is("city_id", null)
    .order("id");

  if (artistId) {
    query = supabase
      .from("artists")
      .select(selectFields)
      .eq("id", artistId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching artists:", error);
    process.exit(1);
  }
  return data || [];
}

async function getLinkedShops(artistId) {
  const { data } = await supabase
    .from("artist_shop")
    .select(
      "shop:tattoo_shops(id, shop_name, instagram_handle, address, city:cities(city_name, state:states(state_name, country:countries(country_name))))"
    )
    .eq("artist_id", artistId);

  return (data || [])
    .map(row => {
      const shop = Array.isArray(row.shop) ? row.shop[0] : row.shop;
      if (!shop) return null;
      const city = Array.isArray(shop.city) ? shop.city[0] : shop.city;
      const state = city
        ? Array.isArray(city.state)
          ? city.state[0]
          : city.state
        : null;
      const country = state
        ? Array.isArray(state.country)
          ? state.country[0]
          : state.country
        : null;
      return {
        shop_name: shop.shop_name,
        instagram_handle: shop.instagram_handle,
        address: shop.address,
        city_name: city?.city_name || null,
        state_name: state?.state_name || null,
        country_name: country?.country_name || null,
      };
    })
    .filter(Boolean);
}

async function printArtistInfo(artist) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${artist.name} (ID: ${artist.id})`);
  console.log(`${"=".repeat(50)}`);

  if (artist.instagram_handle) {
    console.log(
      `  Instagram: @${artist.instagram_handle}  →  https://instagram.com/${artist.instagram_handle}`
    );
  }
  if (artist.url) console.log(`  Website:   ${artist.url}`);
  if (artist.contact) console.log(`  Contact:   ${artist.contact}`);
  if (artist.is_traveling) console.log(`  Traveling: yes`);
  if (artist.created_at) {
    console.log(
      `  Added:     ${new Date(artist.created_at).toLocaleDateString()}`
    );
  }

  // Show linked shops with their locations
  const shops = await getLinkedShops(artist.id);
  if (shops.length > 0) {
    console.log(`  Shops:`);
    for (const shop of shops) {
      const loc = [shop.city_name, shop.state_name, shop.country_name]
        .filter(Boolean)
        .join(", ");
      console.log(`    - ${shop.shop_name}${loc ? ` (${loc})` : ""}`);
      if (shop.address) console.log(`      Address: ${shop.address}`);
      if (shop.instagram_handle) {
        console.log(`      IG: @${shop.instagram_handle}`);
      }
    }

    // Suggest location from shop
    const shopWithLoc = shops.find(s => s.city_name && s.country_name);
    if (shopWithLoc) {
      console.log(
        `\n  ** Suggested from shop: ${shopWithLoc.city_name}, ${shopWithLoc.state_name || "?"}, ${shopWithLoc.country_name} **`
      );
    }
  }

  console.log("");
}

async function fixArtist(artist) {
  await printArtistInfo(artist);

  const countryName = await ask("  Country (or 's' to skip): ");
  if (!countryName || countryName.toLowerCase() === "s") {
    console.log("  Skipped.");
    return false;
  }

  const stateName = await ask("  State/Province: ");
  if (!stateName || stateName.toLowerCase() === "s") {
    console.log("  Skipped.");
    return false;
  }

  const cityName = await ask("  City: ");
  if (!cityName || cityName.toLowerCase() === "s") {
    console.log("  Skipped.");
    return false;
  }

  // Resolve location hierarchy
  const countryId = await getOrCreateCountry(countryName);
  const stateId = await getOrCreateState(stateName, countryId);
  const cityId = await getOrCreateCity(cityName, stateId, countryId);

  // Update artist with city_id
  const { error: updateError } = await supabase
    .from("artists")
    .update({ city_id: cityId })
    .eq("id", artist.id);

  if (updateError) {
    console.error(`  Failed to update artist: ${updateError.message}`);
    return false;
  }

  // Insert artist_location entry (check for existing first)
  const { data: existingLoc } = await supabase
    .from("artist_location")
    .select("id")
    .eq("artist_id", artist.id)
    .eq("city_id", cityId)
    .is("shop_id", null)
    .maybeSingle();

  if (!existingLoc) {
    const { error: locError } = await supabase
      .from("artist_location")
      .insert({
        artist_id: artist.id,
        city_id: cityId,
        is_primary: true,
      });

    if (locError) {
      console.warn(
        `  Warning: artist_location insert failed: ${locError.message}`
      );
    }
  }

  // Geocode city if it doesn't have coordinates
  const { data: cityData } = await supabase
    .from("cities")
    .select("latitude")
    .eq("id", cityId)
    .single();

  if (cityData && cityData.latitude === null) {
    process.stdout.write("  Geocoding city... ");
    const coords = await geocodeCity(cityName, stateName, countryName);
    if (coords) {
      await supabase
        .from("cities")
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq("id", cityId);
      console.log(`OK (${coords.lat}, ${coords.lng})`);
    } else {
      console.log("NOT FOUND (run geocodeCities.js later)");
    }
    await sleep(DELAY_MS);
  }

  console.log(`  Fixed! city_id=${cityId}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const doFix = args.includes("--fix");
  const artistIdx = args.indexOf("--artist");
  const artistId = artistIdx !== -1 ? parseInt(args[artistIdx + 1], 10) : null;

  const artists = await getMissingArtists(artistId);

  if (artists.length === 0) {
    console.log("No artists with missing location data found.");
    return;
  }

  if (!doFix) {
    console.log(
      `Found ${artists.length} artist(s) with missing location:\n`
    );
    for (const a of artists) {
      const ig = a.instagram_handle ? ` (@${a.instagram_handle})` : "";
      const url = a.url ? ` | ${a.url}` : "";
      console.log(`  ID: ${a.id} | ${a.name}${ig}${url}`);
    }
    console.log(
      "\nRun with --fix to interactively assign locations."
    );
    console.log(
      "Run with --fix --artist <id> to fix a specific artist."
    );
    return;
  }

  let fixed = 0;
  for (const artist of artists) {
    const ok = await fixArtist(artist);
    if (ok) fixed++;
  }

  console.log(`\nDone! Fixed ${fixed}/${artists.length} artists.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
