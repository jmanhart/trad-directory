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
    .select("id, name, city_id, instagram_handle")
    .order("id", { ascending: false });

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

  console.log(`Total artists: ${allArtists.length}`);
  console.log(`Artists with artist_location: ${linkedArtistIds.size}`);
  console.log(`Artists WITHOUT artist_location (orphans): ${orphans.length}\n`);

  if (orphans.length === 0) {
    console.log("No orphan artists found.");
    return;
  }

  // 2. Show details for orphans
  for (const a of orphans) {
    // Look up city info if city_id exists
    let cityInfo = "no city_id";
    if (a.city_id) {
      const { data: city } = await supabase
        .from("cities")
        .select("city_name, state:states(state_name), country:countries(country_name)")
        .eq("id", a.city_id)
        .single();

      if (city) {
        const state = Array.isArray(city.state) ? city.state[0] : city.state;
        const country = Array.isArray(city.country) ? city.country[0] : city.country;
        cityInfo = [city.city_name, state?.state_name, country?.country_name]
          .filter(Boolean)
          .join(", ");
      }
    }

    // Check if they have an artist_shop link
    const { data: shopLinks } = await supabase
      .from("artist_shop")
      .select("shop_id")
      .eq("artist_id", a.id);

    const shopInfo = shopLinks?.length
      ? `${shopLinks.length} shop link(s)`
      : "no shop links";

    console.log(
      `  ID ${a.id} | ${a.name} | @${a.instagram_handle || "n/a"} | ${cityInfo} | ${shopInfo}`
    );
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
