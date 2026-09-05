import type { Artist, Shop } from "../types";

export interface Suggestion {
  label: string;
  type: "artist" | "shop" | "location";
  detail?: string;
  id?: number;
  artistCount?: number; // Number of artists in this location (for location suggestions)
}

/**
 * Builds search suggestions from artist data and optionally all countries
 */
export function buildSuggestions(
  artists: Artist[],
  allCountries?: { id: number; country_name: string }[]
): Suggestion[] {
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
    // Use all locations if available, otherwise fall back to flat primary fields
    const locations = artist.locations?.length
      ? artist.locations
      : [
          {
            city_name: artist.city_name,
            state_name: artist.state_name,
            country_name: artist.country_name,
            is_primary: true,
          },
        ];

    locations.forEach((loc) => {
      // Count artists per city/state/country (normalized for case/whitespace).
      if (loc.city_name && loc.city_name !== "N/A") {
        const normalizedCity = loc.city_name.trim();
        locationCounts.set(
          normalizedCity,
          (locationCounts.get(normalizedCity) || 0) + 1
        );
      }
      if (loc.state_name && loc.state_name !== "N/A") {
        const normalizedState = loc.state_name.trim();
        locationCounts.set(
          normalizedState,
          (locationCounts.get(normalizedState) || 0) + 1
        );
      }
      if (loc.country_name && loc.country_name !== "N/A") {
        const normalizedCountry = loc.country_name.trim();
        locationCounts.set(
          normalizedCountry,
          (locationCounts.get(normalizedCountry) || 0) + 1
        );
      }
    });
  });

  // Add every country from the countries table so all appear even with no
  // artists yet (case-insensitive de-dupe against already-counted data).
  if (allCountries && allCountries.length > 0) {
    allCountries.forEach((country) => {
      if (country.country_name && country.country_name !== "N/A") {
        const normalizedCountry = country.country_name.trim();
        const existingKey = Array.from(locationCounts.keys()).find(
          (key) => key.toLowerCase() === normalizedCountry.toLowerCase()
        );
        if (!existingKey) {
          locationCounts.set(normalizedCountry, 0);
        } else if (existingKey !== normalizedCountry) {
          const count = locationCounts.get(existingKey) || 0;
          locationCounts.delete(existingKey);
          locationCounts.set(normalizedCountry, count);
        }
      }
    });
  }

  const uniqueLocations = Array.from(locationCounts.keys());
  const locationSuggestions: Suggestion[] = uniqueLocations.map((location) => ({
    label: location,
    type: "location" as const,
    artistCount: locationCounts.get(location) ?? 0,
  }));

  return [...artistSuggestions, ...shopSuggestions, ...locationSuggestions];
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

