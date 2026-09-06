// Shared mock data for Storybook. Never used by the app itself.
import type { Artist } from "../types/entities";
import type { MapShopData } from "../components/map/MapShopPanel";
import type { CityDot } from "../components/map/MapView";

export const mockArtists: Artist[] = [
  {
    id: 1,
    name: "Sailor Jerry",
    slug: "sailor-jerry",
    instagram_handle: "sailorjerry",
    is_traveling: false,
    city_name: "Honolulu",
    state_name: "Hawaii",
    country_name: "United States",
    shop_id: 10,
    shop_name: "Old Ironside Tattoo",
    shop_slug: "old-ironside-tattoo",
    shop_instagram_handle: "oldironsidetattoo",
    locations: [
      {
        city_name: "Honolulu",
        state_name: "Hawaii",
        country_name: "United States",
        shop_id: 10,
        shop_name: "Old Ironside Tattoo",
        shop_slug: "old-ironside-tattoo",
        shop_instagram_handle: "oldironsidetattoo",
        is_primary: true,
      },
    ],
  },
  {
    id: 2,
    name: "Ed Hardy",
    slug: "ed-hardy",
    instagram_handle: "edhardy",
    is_traveling: false,
    city_name: "Honolulu",
    state_name: "Hawaii",
    country_name: "United States",
    shop_id: 10,
    shop_name: "Old Ironside Tattoo",
    shop_slug: "old-ironside-tattoo",
    shop_instagram_handle: "oldironsidetattoo",
    locations: [
      {
        city_name: "Honolulu",
        state_name: "Hawaii",
        country_name: "United States",
        shop_id: 10,
        shop_name: "Old Ironside Tattoo",
        shop_slug: "old-ironside-tattoo",
        shop_instagram_handle: "oldironsidetattoo",
        is_primary: true,
      },
    ],
  },
  {
    id: 3,
    name: "Bert Grimm",
    slug: "bert-grimm",
    instagram_handle: null,
    is_traveling: false,
    city_name: "Long Beach",
    state_name: "California",
    country_name: "United States",
    shop_id: 11,
    shop_name: "Bert Grimm's World Famous Tattoo",
    shop_slug: "bert-grimm-tattoo",
    shop_instagram_handle: null,
    locations: [
      {
        city_name: "Long Beach",
        state_name: "California",
        country_name: "United States",
        shop_id: 11,
        shop_name: "Bert Grimm's World Famous Tattoo",
        shop_slug: "bert-grimm-tattoo",
        shop_instagram_handle: null,
        is_primary: true,
      },
    ],
  },
  {
    id: 4,
    name: "Kari Barba",
    slug: "kari-barba",
    instagram_handle: "karibarba",
    is_traveling: true,
    city_name: "Anaheim",
    state_name: "California",
    country_name: "United States",
    shop_id: 12,
    shop_name: "Outer Limits Tattoo",
    shop_slug: "outer-limits-tattoo",
    shop_instagram_handle: "outerlimitstattoo",
    locations: [
      {
        city_name: "Anaheim",
        state_name: "California",
        country_name: "United States",
        shop_id: 12,
        shop_name: "Outer Limits Tattoo",
        shop_slug: "outer-limits-tattoo",
        shop_instagram_handle: "outerlimitstattoo",
        is_primary: true,
      },
      {
        city_name: "Long Beach",
        state_name: "California",
        country_name: "United States",
        shop_id: 13,
        shop_name: "Long Beach Tattoo",
        shop_slug: "long-beach-tattoo",
        shop_instagram_handle: "longbeachtattoo",
        is_primary: false,
      },
    ],
  },
];

export const mockShop: MapShopData = {
  id: 10,
  shop_name: "Old Ironside Tattoo",
  slug: "old-ironside-tattoo",
  instagram_handle: "oldironsidetattoo",
  city_name: "Honolulu",
  state_name: "Hawaii",
  country_name: "United States",
  address: "1033 Smith St, Honolulu, HI 96817",
  artists: mockArtists.slice(0, 3),
};

export const mockShopEntries = [
  { id: 10, shop_name: "Old Ironside Tattoo", slug: "old-ironside-tattoo" },
  { id: 11, shop_name: "Bert Grimm's World Famous Tattoo", slug: "bert-grimm-tattoo" },
  { id: 12, shop_name: "Outer Limits Tattoo", slug: "outer-limits-tattoo" },
];

// --- Edge-case fixtures for Storybook permutations ---

/** Artist with no shop association (studio-less / private). */
export const mockArtistNoShop: Artist = {
  id: 20,
  name: "Frida Solene",
  slug: "frida-solene",
  instagram_handle: "frida.solene",
  is_traveling: false,
  city_name: "Mexico City",
  state_name: "CDMX",
  country_name: "Mexico",
  shop_name: "",
  locations: [
    {
      city_name: "Mexico City",
      state_name: "CDMX",
      country_name: "Mexico",
      is_primary: true,
    },
  ],
};

/** Long name + handle + shop name to stress-test truncation/wrapping. */
export const mockArtistLongName: Artist = {
  id: 21,
  name: "Bartholomew Fitzgerald-Montgomery III",
  slug: "bartholomew-fitzgerald-montgomery",
  instagram_handle: "bartholomew_fitzgerald_montgomery_tattoo",
  is_traveling: false,
  city_name: "Llanfairpwllgwyngyll",
  state_name: "Wales",
  country_name: "United Kingdom",
  shop_name: "The Exceptionally Long-Winded Tattoo Emporium & Co.",
  shop_slug: "exceptionally-long-winded-tattoo",
  shop_instagram_handle: "exceptionally_long_winded_tattoo",
  locations: [
    {
      city_name: "Llanfairpwllgwyngyll",
      state_name: "Wales",
      country_name: "United Kingdom",
      shop_id: 30,
      shop_name: "The Exceptionally Long-Winded Tattoo Emporium & Co.",
      shop_slug: "exceptionally-long-winded-tattoo",
      shop_instagram_handle: "exceptionally_long_winded_tattoo",
      is_primary: true,
    },
  ],
};

/** Many artists in one city, to test scrolling / long lists. */
export const mockArtistsMany: Artist[] = Array.from({ length: 18 }, (_, i) => ({
  id: 100 + i,
  name: `Artist Number ${i + 1}`,
  slug: `artist-${i + 1}`,
  instagram_handle: i % 3 === 0 ? null : `artist_${i + 1}`,
  is_traveling: false,
  city_name: "Portland",
  state_name: "Oregon",
  country_name: "United States",
  shop_id: 40,
  shop_name: "Icon Tattoo",
  shop_slug: "icon-tattoo",
  shop_instagram_handle: "icontattoo",
  locations: [
    {
      city_name: "Portland",
      state_name: "Oregon",
      country_name: "United States",
      shop_id: 40,
      shop_name: "Icon Tattoo",
      shop_slug: "icon-tattoo",
      shop_instagram_handle: "icontattoo",
      is_primary: true,
    },
  ],
}));

/** Shop with every optional detail field populated. */
export const mockShopFull: MapShopData = {
  id: 50,
  shop_name: "Old Ironside Tattoo",
  slug: "old-ironside-tattoo",
  instagram_handle: "oldironsidetattoo",
  city_name: "Honolulu",
  state_name: "Hawaii",
  country_name: "United States",
  address: "1033 Smith St, Honolulu, HI 96817",
  phone_number: "+1 808-555-0143",
  website_url: "https://oldironsidetattoo.com",
  contact: "info@oldironsidetattoo.com",
  artists: mockArtists.slice(0, 3),
};

/** Shop with only a name — no location, contact fields, IG, or artists. */
export const mockShopMinimal: MapShopData = {
  id: 51,
  shop_name: "Unnamed Studio",
  artists: [],
};

/** Shop with many artists, to test scrolling. */
export const mockShopManyArtists: MapShopData = {
  ...mockShop,
  artists: mockArtistsMany,
};

/** City dots matching mockArtists' cities, for the region-variant panel. */
export const mockCityDots: CityDot[] = [
  { cityName: "Honolulu", stateName: "Hawaii", countryName: "United States", continent: "North America", lat: 21.3, lng: -157.8, artistCount: 2, shopCount: 1 },
  { cityName: "Long Beach", stateName: "California", countryName: "United States", continent: "North America", lat: 33.8, lng: -118.2, artistCount: 1, shopCount: 1 },
  { cityName: "Anaheim", stateName: "California", countryName: "United States", continent: "North America", lat: 33.8, lng: -117.9, artistCount: 1, shopCount: 1 },
];
