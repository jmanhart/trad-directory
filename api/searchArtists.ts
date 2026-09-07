import { createClient } from "@supabase/supabase-js";
import { Artist } from "./types";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ error: "Query parameter is required" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: artists, error } = await supabase
      .from("artists")
      .select(
        `
        id,
        name,
        instagram_handle,
        artist_location (
          is_primary,
          city: cities (
            city_name,
            state: states (state_name),
            country: countries (country_name)
          ),
          shop: tattoo_shops (id, shop_name, instagram_handle)
        )
      `
      )
      .limit(200);

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform the data and filter based on query
    const normalizedQuery = query.toLowerCase().trim().replace(/^@/, "");

    if (!normalizedQuery) {
      res.status(200).json({ results: [], count: 0, query });
      return;
    }

    const allResults: Artist[] = (artists || []).map((artist: any) => {
      const locs = (
        Array.isArray(artist.artist_location) ? artist.artist_location : []
      ).map((loc: any) => {
        const c = Array.isArray(loc.city) ? loc.city[0] : loc.city;
        const s = Array.isArray(loc.shop) ? loc.shop[0] : loc.shop;
        const st = Array.isArray(c?.state) ? c.state[0] : c?.state;
        const ct = Array.isArray(c?.country) ? c.country[0] : c?.country;
        return {
          city_name: c?.city_name || null,
          state_name: st?.state_name || null,
          country_name: ct?.country_name || null,
          shop_id: s?.id || null,
          shop_name: s?.shop_name || null,
          shop_instagram_handle: s?.instagram_handle || null,
          is_primary: loc.is_primary ?? false,
        };
      });
      const primary = locs.find((l: any) => l.is_primary) || locs[0] || null;
      return {
        id: artist.id,
        name: artist.name,
        instagram_handle: artist.instagram_handle || null,
        city_name: primary?.city_name || null,
        state_name: primary?.state_name || null,
        country_name: primary?.country_name || null,
        shop_id: primary?.shop_id || null,
        shop_name: primary?.shop_name || null,
        shop_instagram_handle: primary?.shop_instagram_handle || null,
      };
    });

    // Filter results based on query - exclude "N/A" values
    const results = allResults.filter((artist) => {
      const cityName = artist.city_name?.toLowerCase();
      const stateName = artist.state_name?.toLowerCase();
      const countryName = artist.country_name?.toLowerCase();
      const shopName = artist.shop_name?.toLowerCase();
      const artistName = artist.name?.toLowerCase();
      const instagramHandle = artist.instagram_handle?.toLowerCase();

      return (
        (artistName && artistName.includes(normalizedQuery)) ||
        (instagramHandle && instagramHandle.includes(normalizedQuery)) ||
        (cityName && cityName !== "n/a" && cityName.includes(normalizedQuery)) ||
        (stateName && stateName !== "n/a" && stateName.includes(normalizedQuery)) ||
        (countryName && countryName !== "n/a" && countryName.includes(normalizedQuery)) ||
        (shopName && shopName !== "n/a" && shopName.includes(normalizedQuery))
      );
    });

    res.status(200).json({
      results,
      count: results.length,
      query,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}
