import { supabase } from "./supabaseClient";
import { createClient } from "@supabase/supabase-js";

/**
 * Safely extracts city, state, and country data from a city object/array
 * Handles null cities, arrays with null elements, and nested state/country structures
 */
function extractLocationData(city: any): { city_name: string; state_name: string; country_name: string } {
  let city_name = "N/A";
  let state_name = "N/A";
  let country_name = "N/A";
  
  if (!city || city === null || city === undefined) {
    return { city_name, state_name, country_name };
  }
  
  if (Array.isArray(city)) {
    // Find first non-null city in array
    const cityData = city.find((c: any) => c !== null && c !== undefined);
    if (cityData && cityData !== null) {
      city_name = cityData?.city_name || "N/A";
      
      // Extract state (nested under city)
      const state = cityData?.state;
      if (state && state !== null && state !== undefined) {
        const stateData = Array.isArray(state) 
          ? (state.find((s: any) => s !== null && s !== undefined) || state[0])
          : state;
        if (stateData && stateData !== null && stateData !== undefined) {
          state_name = stateData?.state_name || "N/A";
        }
      }
      
      // Extract country (nested directly under city, NOT under state!)
      const country = cityData?.country;
      if (country && country !== null && country !== undefined) {
        const countryData = Array.isArray(country)
          ? (country.find((c: any) => c !== null && c !== undefined) || country[0])
          : country;
        if (countryData && countryData !== null && countryData !== undefined) {
          country_name = countryData?.country_name || "N/A";
        }
      }
    }
  } else if (typeof city === 'object') {
    city_name = city?.city_name || "N/A";
    
    // Extract state (nested under city)
    const state = city?.state;
    if (state && state !== null && state !== undefined) {
      const stateData = Array.isArray(state) 
        ? (state.find((s: any) => s !== null && s !== undefined) || state[0])
        : state;
      if (stateData && stateData !== null && stateData !== undefined) {
        state_name = stateData?.state_name || "N/A";
      }
    }
    
    // Extract country (nested directly under city, NOT under state!)
    const country = city?.country;
    if (country && country !== null && country !== undefined) {
      const countryData = Array.isArray(country)
        ? (country.find((c: any) => c !== null && c !== undefined) || country[0])
        : country;
      if (countryData && countryData !== null && countryData !== undefined) {
        country_name = countryData?.country_name || "N/A";
      }
    }
  }
  
  return { city_name, state_name, country_name };
}

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

    const mappedArtists = (data || []).map((artist: any) => {
      try {
        // Safely extract city data - handle null city for traveling artists
        const { city_name, state_name, country_name } = extractLocationData(artist?.city);
        
        return {
          ...artist,
          is_traveling: artist?.is_traveling || false,
          city_name,
          state_name,
          country_name,
          shop_id: artist?.artist_shop?.[0]?.shop?.id || null,
          shop_name: artist?.artist_shop?.[0]?.shop?.shop_name || "N/A",
          shop_instagram_handle:
            artist?.artist_shop?.[0]?.shop?.instagram_handle || null,
        };
      } catch (mapError) {
        console.error("Error mapping artist:", artist?.id, mapError);
        // Return a safe fallback
        return {
          ...artist,
          is_traveling: artist?.is_traveling || false,
          city_name: "N/A",
          state_name: "N/A",
          country_name: "N/A",
          shop_id: null,
          shop_name: "N/A",
          shop_instagram_handle: null,
        };
      }
    });
    
    // Debug: Check country extraction - always log to help diagnose
    {
      const countriesFound = new Set(
        mappedArtists
          .map(a => a.country_name)
          .filter(c => c && c !== "N/A")
      );
      const artistsWithCountry = mappedArtists.filter(a => a.country_name && a.country_name !== "N/A").length;
      const artistsWithoutCountry = mappedArtists.length - artistsWithCountry;
      
      // Sample a few artists to see their country_name values
      const sampleArtists = mappedArtists
        .filter(a => a.country_name && a.country_name !== "N/A")
        .slice(0, 5)
        .map(a => ({ id: a.id, name: a.name, country: a.country_name }));
      
      console.log('[fetchTattooShopsWithArtists] Country extraction:', {
        totalArtists: mappedArtists.length,
        artistsWithCountry,
        artistsWithoutCountry,
        uniqueCountries: Array.from(countriesFound).slice(0, 15),
        sampleArtistsWithCountry: sampleArtists,
      });
      
      // Check for specific countries the user mentioned
      const checkCountries = ['United States', 'United Kingdom', 'Canada'];
      checkCountries.forEach(countryName => {
        const count = mappedArtists.filter(a => 
          a.country_name && 
          a.country_name.trim().toLowerCase() === countryName.toLowerCase()
        ).length;
        if (count > 0) {
          console.log(`[fetchTattooShopsWithArtists] Found ${count} artists in "${countryName}"`);
        }
      });
    }
    
    return mappedArtists;
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
    const { city_name, state_name, country_name } = extractLocationData(data?.city);

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

    // Safely extract shop city data
    const { city_name: shopCityName, state_name: shopStateName, country_name: shopCountryName } = extractLocationData(data?.city);
    
    return {
      ...data,
      instagram_handle: data.instagram_handle || null,
      city_name: shopCityName,
      state_name: shopStateName,
      country_name: shopCountryName,
      artists: (data.artists || []).map((entry: any) => {
        try {
          const artist = entry.artist;
          // Safely extract city data - handle null city for traveling artists
          const { city_name, state_name, country_name } = extractLocationData(artist?.city);
          
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
  const normalizedQuery = query.toLowerCase().trim().replace(/^@/, "");

  if (!normalizedQuery) {
    return [];
  }

  // Filter results based on query - prioritize exact location matches
  const filtered = allArtists.filter((artist) => {
    // Skip artists with "N/A" location values
    const cityName = artist.city_name?.toLowerCase().trim();
    const stateName = artist.state_name?.toLowerCase().trim();
    const countryName = artist.country_name?.toLowerCase().trim();
    const shopName = artist.shop_name?.toLowerCase().trim();
    const artistName = artist.name?.toLowerCase().trim();
    const instagramHandle = artist.instagram_handle?.toLowerCase().trim();

    return (
      (artistName && artistName.includes(normalizedQuery)) ||
      (instagramHandle && instagramHandle.includes(normalizedQuery)) ||
      (cityName && cityName !== "n/a" && cityName.includes(normalizedQuery)) ||
      (stateName && stateName !== "n/a" && stateName.includes(normalizedQuery)) ||
      (countryName && countryName !== "n/a" && countryName.includes(normalizedQuery)) ||
      (shopName && shopName !== "n/a" && shopName.includes(normalizedQuery))
    );
  });

  // Debug logging for country searches - always log to help diagnose
  if (normalizedQuery.length > 2) {
    const countryMatches = filtered.filter(a => 
      a.country_name?.toLowerCase().trim().includes(normalizedQuery)
    );
    
    // Get all unique countries from artist data
    const allCountries = new Set(
      allArtists
        .map(a => a.country_name?.toLowerCase().trim())
        .filter(Boolean)
        .filter(c => c !== "n/a")
    );
    
    console.log(`[searchArtists] Searching for "${normalizedQuery}":`, {
      totalArtists: allArtists.length,
      filteredResults: filtered.length,
      countryMatches: countryMatches.length,
      artistsWithCountry: allArtists.filter(a => a.country_name && a.country_name !== "N/A").length,
      uniqueCountriesInData: Array.from(allCountries).slice(0, 10),
      sampleArtists: allArtists
        .filter(a => a.country_name && a.country_name.toLowerCase().trim().includes(normalizedQuery))
        .slice(0, 3)
        .map(a => ({ id: a.id, name: a.name, country: a.country_name })),
    });
    
    if (countryMatches.length === 0 && Array.from(allCountries).some(c => c.includes(normalizedQuery))) {
      console.warn(`[searchArtists] WARNING: Country "${normalizedQuery}" exists in data but search returned 0 results!`);
      console.warn(`[searchArtists] This suggests a filtering issue. Sample countries in data:`, Array.from(allCountries).slice(0, 10));
    }
  }

  return filtered;
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
          const { city_name, state_name, country_name } = extractLocationData(artist?.city);
          
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
        const { city_name, state_name, country_name } = extractLocationData(artist?.city);
        
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

// Fetch all countries
export async function fetchAllCountries(): Promise<{ id: number; country_name: string }[]> {
  try {
    const { data, error } = await supabase
      .from("countries")
      .select("id, country_name")
      .order("country_name");

    if (error) {
      console.error("Error fetching countries:", error.message);
      throw new Error(error.message);
    }

    const countries = (data || []).map((country: any) => ({
      id: country.id,
      country_name: country.country_name,
    }));
    
    console.log(`[fetchAllCountries] Fetched ${countries.length} countries:`, countries.slice(0, 10).map(c => c.country_name));
    
    return countries;
  } catch (err) {
    console.error("Unhandled error in fetchAllCountries:", err);
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
