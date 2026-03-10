import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100; // Nominatim requires >= 1s between requests

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  if (!res.ok) {
    console.error(`  HTTP ${res.status} for "${query}"`);
    return null;
  }

  const data = await res.json();
  if (!data || data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

async function main() {
  // Fetch cities that don't have coordinates yet
  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select("id, city_name, state_id")
    .is("latitude", null)
    .order("id");

  if (citiesError) {
    console.error("Error fetching cities:", citiesError);
    process.exit(1);
  }

  if (!cities || cities.length === 0) {
    console.log("All cities already have coordinates.");
    return;
  }

  console.log(`Found ${cities.length} cities without coordinates.\n`);

  // Fetch states with countries for lookups
  const stateIds = [
    ...new Set(cities.map(c => c.state_id).filter(Boolean)),
  ];
  const statesMap = new Map();

  if (stateIds.length > 0) {
    const { data: states, error: statesError } = await supabase
      .from("states")
      .select("id, state_name, country:countries(country_name)")
      .in("id", stateIds);

    if (statesError) {
      console.error("Error fetching states:", statesError);
      process.exit(1);
    }

    (states || []).forEach(s => {
      const country = Array.isArray(s.country) ? s.country[0] : s.country;
      statesMap.set(s.id, {
        state_name: s.state_name,
        country_name: country?.country_name || null,
      });
    });
  }

  let success = 0;
  let failed = 0;

  for (const city of cities) {
    const stateInfo = city.state_id ? statesMap.get(city.state_id) : null;
    const stateName = stateInfo?.state_name || null;
    const countryName = stateInfo?.country_name || null;

    process.stdout.write(
      `Geocoding: ${city.city_name}${stateName ? `, ${stateName}` : ""}${countryName ? `, ${countryName}` : ""} ... `
    );

    const result = await geocodeCity(city.city_name, stateName, countryName);

    if (result) {
      const { error: updateError } = await supabase
        .from("cities")
        .update({ latitude: result.lat, longitude: result.lng })
        .eq("id", city.id);

      if (updateError) {
        console.log(`DB ERROR: ${updateError.message}`);
        failed++;
      } else {
        console.log(`OK (${result.lat}, ${result.lng})`);
        success++;
      }
    } else {
      console.log("NOT FOUND");
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone! ${success} geocoded, ${failed} failed.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
