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

// import { supabase } from "./supabaseClient";

// interface Artist {
//   id: number;
//   name: string;
//   instagram_handle: string;
// }

// interface Shop {
//   id: number;
//   shop_name: string;
//   address: string;
//   phone_number: string;
//   instagram_handle: string;
//   website_url: string;
//   city_name: string;
//   state_name: string;
//   country_name: string;
//   artists: Artist[];
// }

// export async function fetchTattooShopsWithArtists(): Promise<Shop[]> {
//   const { data, error } = await supabase.from("tattoo_shops").select(`
//       id,
//       shop_name,
//       address,
//       phone_number,
//       instagram_handle,
//       website_url,
//       cities (
//         city_name,
//         states (
//           state_name
//         ),
//         countries (
//           country_name
//         )
//       ),
//       artist_shop (
//         artists (
//           id,
//           name,
//           instagram_handle
//         )
//       )
//     `);

//   if (error) throw new Error(error.message);

//   return data.map((shop: any) => ({
//     ...shop,
//     city_name: shop.cities.city_name,
//     state_name: shop.cities.states.state_name,
//     country_name: shop.cities.countries.country_name,
//     artists: shop.artist_shop.map((artist_entry: any) => artist_entry.artists),
//   }));
// }
