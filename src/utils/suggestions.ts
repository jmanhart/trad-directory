export interface Artist {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_name?: string | null;
}

export interface Suggestion {
  label: string;
  type: "artist" | "shop" | "location";
  detail?: string;
  id?: number;
  artistCount?: number; // Number of artists in this location (for location suggestions)
}

/**
 * Builds search suggestions from artist data
 */
export function buildSuggestions(artists: Artist[]): Suggestion[] {
  // Artist suggestions with unique ids
  const uniqueIds = Array.from(new Set(artists.map((a) => a.id)));
  const artistSuggestions: Suggestion[] = uniqueIds.map((id) => {
    const artist = artists.find((a) => a.id === id)!;
    return {
      label: artist.name,
      type: "artist" as const,
      detail: artist?.instagram_handle ? `@${artist.instagram_handle}` : "",
      id: artist.id,
    };
  });

  // Shop suggestions (unique shop names)
  const uniqueShops = Array.from(
    new Set(
      artists
        .filter((artist) => artist.shop_name && artist.shop_name !== "N/A")
        .map((artist) => artist.shop_name as string)
    )
  );
  const shopSuggestions: Suggestion[] = uniqueShops.map((name) => ({
    label: name,
    type: "shop" as const,
  }));

  // Location suggestions (unique cities, states, countries) with artist counts
  const locationCounts = new Map<string, number>();
  
  artists.forEach((artist) => {
    // Count artists per city
    if (artist.city_name && artist.city_name !== "N/A") {
      locationCounts.set(
        artist.city_name,
        (locationCounts.get(artist.city_name) || 0) + 1
      );
    }
    // Count artists per state
    if (artist.state_name && artist.state_name !== "N/A") {
      locationCounts.set(
        artist.state_name,
        (locationCounts.get(artist.state_name) || 0) + 1
      );
    }
    // Count artists per country
    if (artist.country_name && artist.country_name !== "N/A") {
      locationCounts.set(
        artist.country_name,
        (locationCounts.get(artist.country_name) || 0) + 1
      );
    }
  });

  const uniqueLocations = Array.from(locationCounts.keys());
  const locationSuggestions: Suggestion[] = uniqueLocations.map(
    (location) => {
      const count = locationCounts.get(location) || 0;
      return {
        label: location,
        type: "location" as const,
        artistCount: count,
      };
    }
  );

  return [...artistSuggestions, ...shopSuggestions, ...locationSuggestions];
}

export interface Shop {
  id: number;
  shop_name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  address?: string | null;
}

/**
 * Builds search suggestions from shop data
 */
export function buildShopSuggestions(shops: Shop[]): Suggestion[] {
  // Shop suggestions with unique ids
  const uniqueIds = Array.from(new Set(shops.map((s) => s.id)));
  const shopSuggestions: Suggestion[] = uniqueIds.map((id) => {
    const shop = shops.find((s) => s.id === id)!;
    return {
      label: shop.shop_name,
      type: "shop" as const,
      detail: shop?.instagram_handle ? `@${shop.instagram_handle}` : "",
      id: shop.id,
    };
  });

  // Location suggestions (unique cities, states, countries)
  const uniqueLocations = Array.from(
    new Set(
      shops.flatMap((shop) => [
        shop.city_name,
        shop.state_name,
        shop.country_name,
      ])
    )
  ).filter(Boolean) as string[];
  const locationSuggestions: Suggestion[] = uniqueLocations.map(
    (location) => ({
      label: location,
      type: "location" as const,
    })
  );

  return [...shopSuggestions, ...locationSuggestions];
}

