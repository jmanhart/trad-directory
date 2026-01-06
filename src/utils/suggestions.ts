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

  // Location suggestions (unique cities, states, countries)
  const uniqueLocations = Array.from(
    new Set(
      artists.flatMap((artist) => [
        artist.city_name,
        artist.state_name,
        artist.country_name,
      ])
    )
  ).filter(Boolean) as string[];
  const locationSuggestions: Suggestion[] = uniqueLocations.map(
    (location) => ({
      label: location,
      type: "location" as const,
    })
  );

  return [...artistSuggestions, ...shopSuggestions, ...locationSuggestions];
}

