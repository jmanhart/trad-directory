import { supabase } from "./supabaseClient";

// Fetch all tattoo shops with their associated artists
export async function fetchTattooShopsWithArtists() {
  try {
    const { data, error } = await supabase.from("artists").select(`
        id,
        name,
        instagram_handle,
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

    return (data || []).map((artist: any) => ({
      ...artist,
      city_name: Array.isArray(artist.city)
        ? artist.city[0]?.city_name
        : artist.city?.city_name || "N/A",
      state_name: Array.isArray(artist.city?.state)
        ? artist.city.state[0]?.state_name
        : artist.city.state?.state_name || "N/A",
      country_name: Array.isArray(artist.city?.country)
        ? artist.city.country[0]?.country_name
        : artist.city.country?.country_name || "N/A",
      shop_id: artist.artist_shop?.[0]?.shop?.id || null,
      shop_name: artist.artist_shop?.[0]?.shop?.shop_name || "N/A",
      shop_instagram_handle:
        artist.artist_shop?.[0]?.shop?.instagram_handle || null,
    }));
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

    return {
      ...data,
      city_name: Array.isArray(data.city)
        ? data.city[0]?.city_name
        : data.city?.city_name || "N/A",
      state_name: Array.isArray(data.city?.state)
        ? data.city.state[0]?.state_name
        : data.city.state?.state_name || "N/A",
      country_name: Array.isArray(data.city?.country)
        ? data.city.country[0]?.country_name
        : data.city.country?.country_name || "N/A",
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
        address,
        city: cities (
          city_name,
          state: states (state_name),
          country: countries (country_name)
        ),
        artists: artist_shop (
          artist: artists (id, name, instagram_handle)
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
      city_name: Array.isArray(data.city)
        ? data.city[0]?.city_name
        : data.city?.city_name || "N/A",
      state_name: Array.isArray(data.city?.state)
        ? data.city.state[0]?.state_name
        : data.city.state?.state_name || "N/A",
      country_name: Array.isArray(data.city?.country)
        ? data.city.country[0]?.country_name
        : data.city.country?.country_name || "N/A",
      artists: (data.artists || []).map((entry: any) => ({
        id: entry.artist.id,
        name: entry.artist.name,
        instagram_handle: entry.artist.instagram_handle || null,
      })),
    };
  } catch (err) {
    console.error(`Unhandled error in fetchShopById for ID ${id}:`, err);
    throw err;
  }
}
