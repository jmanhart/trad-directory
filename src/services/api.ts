import { supabase } from "./supabaseClient";

export async function fetchTattooShopsWithArtists() {
  const { data, error } = await supabase.from("artists").select(`
      id,
      name,
      instagram_handle,
      city: cities (city_name, state: states (state_name), country: countries (country_name)),
      artist_shop (
        shop: tattoo_shops (id, shop_name, instagram_handle)
      )
    `);

  if (error) throw new Error(error.message);

  return data.map((artist: any) => ({
    ...artist,
    city_name: artist.city.city_name,
    state_name: artist.city.state.state_name,
    country_name: artist.city.country.country_name,
    shop_name: artist.artist_shop[0]?.shop?.shop_name || "N/A",
    shop_instagram_handle:
      artist.artist_shop[0]?.shop?.instagram_handle || null,
  }));
}
