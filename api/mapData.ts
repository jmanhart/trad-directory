import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
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
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // 1. Fetch cities with coordinates
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("id, city_name, state_id, country_id, latitude, longitude")
      .not("latitude", "is", null)
      .order("city_name");

    if (citiesError) {
      res.status(500).json({ error: "Database query failed" });
      return;
    }

    // 2. Fetch states with countries
    const stateIds = [
      ...new Set((cities || []).map((c: any) => c.state_id).filter(Boolean)),
    ];
    const statesMap = new Map();
    if (stateIds.length > 0) {
      const { data: states } = await supabase
        .from("states")
        .select("id, state_name, country_id, country:countries(id, country_name, continent)")
        .in("id", stateIds);

      (states || []).forEach((s: any) => {
        const country = Array.isArray(s.country) ? s.country[0] : s.country;
        statesMap.set(s.id, {
          state_name: s.state_name,
          country_id: country?.id || null,
          country_name: country?.country_name || null,
          continent: country?.continent || null,
        });
      });
    }

    // 2b. Fetch countries for cities that have country_id but no state
    const countryIds = [
      ...new Set(
        (cities || [])
          .filter((c: any) => !c.state_id && c.country_id)
          .map((c: any) => c.country_id)
      ),
    ];
    const countriesMap = new Map();
    if (countryIds.length > 0) {
      const { data: countries } = await supabase
        .from("countries")
        .select("id, country_name, continent")
        .in("id", countryIds);

      (countries || []).forEach((c: any) => {
        countriesMap.set(c.id, {
          country_name: c.country_name,
          continent: c.continent,
        });
      });
    }

    // 3. Count artists per city via artist_location
    const { data: artistLocs } = await supabase
      .from("artist_location")
      .select("artist_id, city_id");

    const artistCountMap = new Map<number, Set<number>>();
    (artistLocs || []).forEach((al: any) => {
      if (!artistCountMap.has(al.city_id)) {
        artistCountMap.set(al.city_id, new Set());
      }
      artistCountMap.get(al.city_id)!.add(al.artist_id);
    });

    // 4. Count shops per city
    const { data: shops } = await supabase
      .from("tattoo_shops")
      .select("id, city_id");

    const shopCountMap = new Map<number, number>();
    (shops || []).forEach((s: any) => {
      shopCountMap.set(s.city_id, (shopCountMap.get(s.city_id) || 0) + 1);
    });

    // 5. Build response - only cities that have artists
    const results = (cities || [])
      .map((city: any) => {
        const state = city.state_id ? statesMap.get(city.state_id) : null;
        // Fallback: if no state, look up country directly from city.country_id
        const directCountry =
          !state && city.country_id
            ? countriesMap.get(city.country_id)
            : null;
        const artistCount = artistCountMap.get(city.id)?.size || 0;
        const shopCount = shopCountMap.get(city.id) || 0;

        if (artistCount === 0) return null;

        return {
          id: city.id,
          city_name: city.city_name,
          state_name: state?.state_name || null,
          country_name:
            state?.country_name || directCountry?.country_name || null,
          continent:
            state?.continent || directCountry?.continent || null,
          latitude: city.latitude,
          longitude: city.longitude,
          artist_count: artistCount,
          shop_count: shopCount,
        };
      })
      .filter(Boolean);

    res.status(200).json({ cities: results });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
