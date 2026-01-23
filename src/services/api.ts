import { supabase } from "./supabaseClient";
import { createClient } from "@supabase/supabase-js";

// Fetch all tattoo shops with their associated artists
export async function fetchTattooShopsWithArtists() {
  try {
    const { data, error } = await supabase.from("artists").select(`
        id,
        name,
        instagram_handle,
        created_at,
        is_traveling,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        ),
        artist_shop (
          shop: tattoo_shops (id, shop_name, instagram_handle)
        )
      `);

    if (error) {
      console.error("Error fetching artists with shops:", error.message);
      throw new Error(error.message);
    }

    if (!data) {
      console.warn("No data returned from fetchTattooShopsWithArtists");
      return [];
    }

    return (data || []).map((artist: any) => {
      try {
        // Safely extract city data - handle null city for traveling artists
        const city = artist.city;
        let city_name = "N/A";
        let state_name = "N/A";
        let country_name = "N/A";
        
        if (city) {
          if (Array.isArray(city)) {
            const cityData = city[0];
            if (cityData) {
              city_name = cityData.city_name || "N/A";
              const state = cityData.state;
              if (state) {
                const stateData = Array.isArray(state) ? state[0] : state;
                if (stateData) {
                  state_name = stateData.state_name || "N/A";
                  const country = stateData.country;
                  if (country) {
                    const countryData = Array.isArray(country) ? country[0] : country;
                    if (countryData) {
                      country_name = countryData.country_name || "N/A";
                    }
                  }
                }
              }
            }
          } else {
            city_name = city.city_name || "N/A";
            const state = city.state;
            if (state) {
              const stateData = Array.isArray(state) ? state[0] : state;
              if (stateData) {
                state_name = stateData.state_name || "N/A";
                const country = stateData.country;
                if (country) {
                  const countryData = Array.isArray(country) ? country[0] : country;
                  if (countryData) {
                    country_name = countryData.country_name || "N/A";
                  }
                }
              }
            }
          }
        }
        
        return {
          ...artist,
          is_traveling: artist.is_traveling || false,
          city_name,
          state_name,
          country_name,
          shop_id: artist.artist_shop?.[0]?.shop?.id || null,
          shop_name: artist.artist_shop?.[0]?.shop?.shop_name || "N/A",
          shop_instagram_handle:
            artist.artist_shop?.[0]?.shop?.instagram_handle || null,
        };
      } catch (mapError) {
        console.error("Error mapping artist:", artist.id, mapError);
        // Return a safe fallback
        return {
          ...artist,
          is_traveling: artist.is_traveling || false,
          city_name: "N/A",
          state_name: "N/A",
          country_name: "N/A",
          shop_id: null,
          shop_name: "N/A",
          shop_instagram_handle: null,
        };
      }
    });
  } catch (err) {
    console.error("Unhandled error in fetchTattooShopsWithArtists:", err);
    throw err;
  }
}

// Fetch an individual artist by ID
export async function fetchArtistById(id: number) {
  try {
    const { data, error } = await supabase
      .from("artists")
      .select(
        `
        id,
        name,
        instagram_handle,
        is_traveling,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        ),
        artist_shop (
          shop: tattoo_shops (id, shop_name, instagram_handle)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching artist with ID ${id}:`, error.message);
      throw new Error(error.message);
    }

    // Safely extract city data - handle null city for traveling artists
    const city = data.city;
    let city_name = "N/A";
    let state_name = "N/A";
    let country_name = "N/A";
    
    if (city) {
      if (Array.isArray(city)) {
        const cityData = city[0];
        if (cityData) {
          city_name = cityData.city_name || "N/A";
          const state = cityData.state;
          if (state) {
            const stateData = Array.isArray(state) ? state[0] : state;
            if (stateData) {
              state_name = stateData.state_name || "N/A";
              const country = stateData.country;
              if (country) {
                const countryData = Array.isArray(country) ? country[0] : country;
                if (countryData) {
                  country_name = countryData.country_name || "N/A";
                }
              }
            }
          }
        }
      } else {
        city_name = city.city_name || "N/A";
        const state = city.state;
        if (state) {
          const stateData = Array.isArray(state) ? state[0] : state;
          if (stateData) {
            state_name = stateData.state_name || "N/A";
            const country = stateData.country;
            if (country) {
              const countryData = Array.isArray(country) ? country[0] : country;
              if (countryData) {
                country_name = countryData.country_name || "N/A";
              }
            }
          }
        }
      }
    }

    return {
      ...data,
      is_traveling: data.is_traveling || false,
      city_name,
      state_name,
      country_name,
      shop_id: data.artist_shop?.[0]?.shop?.id || null,
      shop_name: data.artist_shop?.[0]?.shop?.shop_name || "N/A",
      shop_instagram_handle:
        data.artist_shop?.[0]?.shop?.instagram_handle || null,
    };
  } catch (err) {
    console.error(`Unhandled error in fetchArtistById for ID ${id}:`, err);
    throw err;
  }
}

// Fetch an individual shop by ID, including its artists
export async function fetchShopById(id: number) {
  try {
    const { data, error } = await supabase
      .from("tattoo_shops")
      .select(
        `
        id,
        shop_name,
        instagram_handle,
        address,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        ),
        artists: artist_shop (
          artist: artists (id, name, instagram_handle, is_traveling, city: cities (
            city_name,
            state: states (state_name),
            country: countries (country_name)
          ), artist_shop (
            shop: tattoo_shops (id, shop_name, instagram_handle)
          ))
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching shop with ID ${id}:`, error.message);
      throw new Error(error.message);
    }

    return {
      ...data,
      instagram_handle: data.instagram_handle || null,
      city_name: Array.isArray(data.city)
        ? data.city[0]?.city_name
        : data.city?.city_name || "N/A",
      state_name: Array.isArray(data.city?.state)
        ? data.city.state[0]?.state_name
        : data.city.state?.state_name || "N/A",
      country_name: Array.isArray(data.city?.country)
        ? data.city.country[0]?.country_name
        : data.city.country?.country_name || "N/A",
      artists: (data.artists || []).map((entry: any) => {
        try {
          const artist = entry.artist;
          // Safely extract city data - handle null city for traveling artists
          const city = artist.city;
          let city_name = "N/A";
          let state_name = "N/A";
          let country_name = "N/A";
          
          if (city) {
            if (Array.isArray(city)) {
              const cityData = city[0];
              if (cityData) {
                city_name = cityData.city_name || "N/A";
                const state = cityData.state;
                if (state) {
                  const stateData = Array.isArray(state) ? state[0] : state;
                  if (stateData) {
                    state_name = stateData.state_name || "N/A";
                    const country = stateData.country;
                    if (country) {
                      const countryData = Array.isArray(country) ? country[0] : country;
                      if (countryData) {
                        country_name = countryData.country_name || "N/A";
                      }
                    }
                  }
                }
              }
            } else {
              city_name = city.city_name || "N/A";
              const state = city.state;
              if (state) {
                const stateData = Array.isArray(state) ? state[0] : state;
                if (stateData) {
                  state_name = stateData.state_name || "N/A";
                  const country = stateData.country;
                  if (country) {
                    const countryData = Array.isArray(country) ? country[0] : country;
                    if (countryData) {
                      country_name = countryData.country_name || "N/A";
                    }
                  }
                }
              }
            }
          }
          
          return {
            id: artist.id,
            name: artist.name,
            instagram_handle: artist.instagram_handle || null,
            is_traveling: artist.is_traveling || false,
            city_name,
            state_name,
            country_name,
            shop_id: artist.artist_shop?.[0]?.shop?.id || null,
            shop_name: artist.artist_shop?.[0]?.shop?.shop_name || "N/A",
            shop_instagram_handle: artist.artist_shop?.[0]?.shop?.instagram_handle || null,
          };
        } catch (mapError) {
          console.error("Error mapping artist in shop:", entry.artist?.id, mapError);
          // Return a safe fallback
          const artist = entry.artist;
          return {
            id: artist?.id || 0,
            name: artist?.name || "Unknown",
            instagram_handle: artist?.instagram_handle || null,
            is_traveling: artist?.is_traveling || false,
            city_name: "N/A",
            state_name: "N/A",
            country_name: "N/A",
            shop_id: null,
            shop_name: "N/A",
            shop_instagram_handle: null,
          };
        }
      }),
    };
  } catch (err) {
    console.error(`Unhandled error in fetchShopById for ID ${id}:`, err);
    throw err;
  }
}

// Compute top cities by artist count using the fetched artists data
export async function fetchTopCitiesByArtistCount(
  limit: number = 5
): Promise<{ city_name: string; count: number }[]> {
  const artists = await fetchTattooShopsWithArtists();
  const counts = new Map<string, number>();

  for (const a of artists as any[]) {
    const key = a.city_name || "N/A";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const results = Array.from(counts.entries())
    .map(([city_name, count]) => ({ city_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return results;
}

// Search artists using the same data source as top cities for consistency
export async function searchArtists(query: string) {
  // Use the same data source as fetchTattooShopsWithArtists for consistency
  const allArtists = await fetchTattooShopsWithArtists();

  // Transform the data and filter based on query
  const normalizedQuery = query.toLowerCase().replace(/^@/, "");

  // Filter results based on query
  return allArtists.filter(
    artist =>
      artist.name?.toLowerCase().includes(normalizedQuery) ||
      artist.instagram_handle?.toLowerCase().includes(normalizedQuery) ||
      artist.city_name?.toLowerCase().includes(normalizedQuery) ||
      artist.state_name?.toLowerCase().includes(normalizedQuery) ||
      artist.country_name?.toLowerCase().includes(normalizedQuery) ||
      artist.shop_name?.toLowerCase().includes(normalizedQuery)
  );
}

// Fetch recently added artists (ordered by id descending, limit to most recent)
export async function fetchRecentArtists(limit: number = 6) {
  try {
    // Try to fetch with created_at first, fallback to without if it fails
    let query = supabase
      .from("artists")
      .select(`
        id,
        name,
        instagram_handle,
        created_at,
        is_traveling,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        ),
        artist_shop (
          shop: tattoo_shops (id, shop_name, instagram_handle)
        )
      `)
      .order("id", { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    // If error occurs, try without created_at field (it might not exist)
    if (error) {
      console.warn("Error fetching with created_at, retrying without it:", error.message);
      const { data: dataWithoutTimestamp, error: errorWithoutTimestamp } = await supabase
        .from("artists")
        .select(`
          id,
          name,
          instagram_handle,
          is_traveling,
          city: cities (
            city_name,
            state: states (state_name),
            country: countries (country_name)
          ),
          artist_shop (
            shop: tattoo_shops (id, shop_name, instagram_handle)
          )
        `)
        .order("id", { ascending: false })
        .limit(limit);

      if (errorWithoutTimestamp) {
        console.error("Error fetching recent artists:", errorWithoutTimestamp.message);
        throw new Error(errorWithoutTimestamp.message);
      }

      return (dataWithoutTimestamp || []).map((artist: any) => {
        try {
          // Safely extract city data - handle null city for traveling artists
          const city = artist.city;
          let city_name = "N/A";
          let state_name = "N/A";
          let country_name = "N/A";
          
          if (city) {
            if (Array.isArray(city)) {
              const cityData = city[0];
              if (cityData) {
                city_name = cityData.city_name || "N/A";
                const state = cityData.state;
                if (state) {
                  const stateData = Array.isArray(state) ? state[0] : state;
                  if (stateData) {
                    state_name = stateData.state_name || "N/A";
                    const country = stateData.country;
                    if (country) {
                      const countryData = Array.isArray(country) ? country[0] : country;
                      if (countryData) {
                        country_name = countryData.country_name || "N/A";
                      }
                    }
                  }
                }
              }
            } else {
              city_name = city.city_name || "N/A";
              const state = city.state;
              if (state) {
                const stateData = Array.isArray(state) ? state[0] : state;
                if (stateData) {
                  state_name = stateData.state_name || "N/A";
                  const country = stateData.country;
                  if (country) {
                    const countryData = Array.isArray(country) ? country[0] : country;
                    if (countryData) {
                      country_name = countryData.country_name || "N/A";
                    }
                  }
                }
              }
            }
          }
          
          return {
            ...artist,
            created_at: null,
            is_traveling: artist.is_traveling || false,
            city_name,
            state_name,
            country_name,
            shop_id: artist.artist_shop?.[0]?.shop?.id || null,
            shop_name: artist.artist_shop?.[0]?.shop?.shop_name || "N/A",
            shop_instagram_handle:
              artist.artist_shop?.[0]?.shop?.instagram_handle || null,
          };
        } catch (mapError) {
          console.error("Error mapping recent artist:", artist.id, mapError);
          // Return a safe fallback
          return {
            ...artist,
            created_at: null,
            is_traveling: artist.is_traveling || false,
            city_name: "N/A",
            state_name: "N/A",
            country_name: "N/A",
            shop_id: null,
            shop_name: "N/A",
            shop_instagram_handle: null,
          };
        }
      });
    }

    return (data || []).map((artist: any) => {
      try {
        // Safely extract city data - handle null city for traveling artists
        const city = artist.city;
        let city_name = "N/A";
        let state_name = "N/A";
        let country_name = "N/A";
        
        if (city) {
          if (Array.isArray(city)) {
            const cityData = city[0];
            if (cityData) {
              city_name = cityData.city_name || "N/A";
              const state = cityData.state;
              if (state) {
                const stateData = Array.isArray(state) ? state[0] : state;
                if (stateData) {
                  state_name = stateData.state_name || "N/A";
                  const country = stateData.country;
                  if (country) {
                    const countryData = Array.isArray(country) ? country[0] : country;
                    if (countryData) {
                      country_name = countryData.country_name || "N/A";
                    }
                  }
                }
              }
            }
          } else {
            city_name = city.city_name || "N/A";
            const state = city.state;
            if (state) {
              const stateData = Array.isArray(state) ? state[0] : state;
              if (stateData) {
                state_name = stateData.state_name || "N/A";
                const country = stateData.country;
                if (country) {
                  const countryData = Array.isArray(country) ? country[0] : country;
                  if (countryData) {
                    country_name = countryData.country_name || "N/A";
                  }
                }
              }
            }
          }
        }
        
        return {
          ...artist,
          is_traveling: artist.is_traveling || false,
          city_name,
          state_name,
          country_name,
          shop_id: artist.artist_shop?.[0]?.shop?.id || null,
          shop_name: artist.artist_shop?.[0]?.shop?.shop_name || "N/A",
          shop_instagram_handle:
            artist.artist_shop?.[0]?.shop?.instagram_handle || null,
        };
      } catch (mapError) {
        console.error("Error mapping recent artist:", artist.id, mapError);
        // Return a safe fallback
        return {
          ...artist,
          is_traveling: artist.is_traveling || false,
          city_name: "N/A",
          state_name: "N/A",
          country_name: "N/A",
          shop_id: null,
          shop_name: "N/A",
          shop_instagram_handle: null,
        };
      }
    });
  } catch (err) {
    console.error("Unhandled error in fetchRecentArtists:", err);
    throw err;
  }
}

// Fetch all tattoo shops
export async function fetchAllShops() {
  try {
    const { data, error } = await supabase
      .from("tattoo_shops")
      .select(`
        id,
        shop_name,
        instagram_handle,
        address,
        created_at,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        )
      `)
      .order("shop_name", { ascending: true });

    if (error) {
      console.error("Error fetching all shops:", error.message);
      throw new Error(error.message);
    }

    return (data || []).map((shop: any) => ({
      id: shop.id,
      shop_name: shop.shop_name,
      instagram_handle: shop.instagram_handle || null,
      address: shop.address || null,
      created_at: shop.created_at || null,
      city_name: Array.isArray(shop.city)
        ? shop.city[0]?.city_name
        : shop.city?.city_name || "N/A",
      state_name: Array.isArray(shop.city?.state)
        ? shop.city.state[0]?.state_name
        : shop.city.state?.state_name || "N/A",
      country_name: Array.isArray(shop.city?.country)
        ? shop.city.country[0]?.country_name
        : shop.city.country?.country_name || "N/A",
    }));
  } catch (err) {
    console.error("Unhandled error in fetchAllShops:", err);
    throw err;
  }
}

// Fetch recently added tattoo shops (ordered by id descending, limit to most recent)
export async function fetchRecentShops(limit: number = 6) {
  try {
    // Try to fetch with created_at first, fallback to without if it fails
    let query = supabase
      .from("tattoo_shops")
      .select(`
        id,
        shop_name,
        instagram_handle,
        address,
        created_at,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        )
      `)
      .order("id", { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    // If error occurs, try without created_at field (it might not exist)
    if (error) {
      console.warn("Error fetching with created_at, retrying without it:", error.message);
      const { data: dataWithoutTimestamp, error: errorWithoutTimestamp } = await supabase
        .from("tattoo_shops")
        .select(`
          id,
          shop_name,
          instagram_handle,
          address,
          city: cities (
            city_name,
            state: states (state_name),
            country: countries (country_name)
          )
        `)
        .order("id", { ascending: false })
        .limit(limit);

      if (errorWithoutTimestamp) {
        console.error("Error fetching recent shops:", errorWithoutTimestamp.message);
        throw new Error(errorWithoutTimestamp.message);
      }

      return (dataWithoutTimestamp || []).map((shop: any) => ({
        id: shop.id,
        shop_name: shop.shop_name,
        instagram_handle: shop.instagram_handle || null,
        address: shop.address || null,
        created_at: null,
        city_name: Array.isArray(shop.city)
          ? shop.city[0]?.city_name
          : shop.city?.city_name || "N/A",
        state_name: Array.isArray(shop.city?.state)
          ? shop.city.state[0]?.state_name
          : shop.city.state?.state_name || "N/A",
        country_name: Array.isArray(shop.city?.country)
          ? shop.city.country[0]?.country_name
          : shop.city.country?.country_name || "N/A",
      }));
    }

    return (data || []).map((shop: any) => ({
      id: shop.id,
      shop_name: shop.shop_name,
      instagram_handle: shop.instagram_handle || null,
      address: shop.address || null,
      created_at: shop.created_at || null,
      city_name: Array.isArray(shop.city)
        ? shop.city[0]?.city_name
        : shop.city?.city_name || "N/A",
      state_name: Array.isArray(shop.city?.state)
        ? shop.city.state[0]?.state_name
        : shop.city.state?.state_name || "N/A",
      country_name: Array.isArray(shop.city?.country)
        ? shop.city.country[0]?.country_name
        : shop.city.country?.country_name || "N/A",
    }));
  } catch (err) {
    console.error("Unhandled error in fetchRecentShops:", err);
    throw err;
  }
}
