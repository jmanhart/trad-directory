import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Fetch ALL artists, paginating past Supabase's 1000-row default cap
    const pageSize = 1000;
    let artists: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("artists")
        .select(
          `
        id,
        name,
        instagram_handle,
        is_traveling,
        artist_location (
          is_primary,
          city_id,
          role,
          sort_order,
          city: cities (
            city_name,
            state: states (state_name),
            country: countries (country_name)
          ),
          shop: tattoo_shops (id, shop_name, instagram_handle)
        )
      `
        )
        .order("name")
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Supabase error:", error);
        res.status(500).json({
          error: "Database query failed",
        });
        return;
      }

      artists = artists.concat(data || []);
      hasMore = (data?.length || 0) === pageSize;
      offset += pageSize;
    }

    const results = (artists || []).map((artist: any) => {
      const locations = (
        Array.isArray(artist.artist_location) ? artist.artist_location : []
      )
        .map((loc: any) => {
          const c = Array.isArray(loc.city) ? loc.city[0] : loc.city;
          const s = Array.isArray(loc.shop) ? loc.shop[0] : loc.shop;
          const st = Array.isArray(c?.state) ? c.state[0] : c?.state;
          const ct = Array.isArray(c?.country) ? c.country[0] : c?.country;
          return {
            city_id: loc.city_id ?? null,
            city_name: c?.city_name || null,
            state_name: st?.state_name || null,
            country_name: ct?.country_name || null,
            shop_name: s?.shop_name || null,
            shop_instagram_handle: s?.instagram_handle || null,
            is_primary: loc.is_primary ?? false,
            role: loc.role || null,
            sort_order: loc.sort_order ?? 0,
          };
        })
        .sort(
          (a: any, b: any) =>
            (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) ||
            a.sort_order - b.sort_order
        );
      const primary =
        locations.find((l: any) => l.is_primary) || locations[0] || null;
      return {
        id: artist.id,
        name: artist.name,
        instagram_handle: artist.instagram_handle || null,
        is_traveling: artist.is_traveling || false,
        city_id: primary?.city_id ?? null,
        // Flat fields come from the primary location.
        city_name: primary?.city_name ?? null,
        state_name: primary?.state_name ?? null,
        country_name: primary?.country_name ?? null,
        shop_name: primary?.shop_name ?? null,
        shop_instagram_handle: primary?.shop_instagram_handle ?? null,
        // Full set of locations for multi-shop / multi-city consumers.
        locations,
      };
    });

    res.status(200).json({ artists: results });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}
