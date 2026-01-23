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
  
  // Debug: Track country names found in artist data
  const countriesInArtistData = new Set<string>();
  let artistsWithCountry = 0;
  let artistsWithoutCountry = 0;
  
  artists.forEach((artist) => {
    // Count artists per city (normalize to handle case/whitespace differences)
    if (artist.city_name && artist.city_name !== "N/A") {
      const normalizedCity = artist.city_name.trim();
      locationCounts.set(
        normalizedCity,
        (locationCounts.get(normalizedCity) || 0) + 1
      );
    }
    // Count artists per state (normalize to handle case/whitespace differences)
    if (artist.state_name && artist.state_name !== "N/A") {
      const normalizedState = artist.state_name.trim();
      locationCounts.set(
        normalizedState,
        (locationCounts.get(normalizedState) || 0) + 1
      );
    }
    // Count artists per country (normalize to handle case/whitespace differences)
    if (artist.country_name && artist.country_name !== "N/A") {
      artistsWithCountry++;
      const normalizedCountry = artist.country_name.trim();
      countriesInArtistData.add(normalizedCountry);
      locationCounts.set(
        normalizedCountry,
        (locationCounts.get(normalizedCountry) || 0) + 1
      );
    } else {
      artistsWithoutCountry++;
    }
  });
  
  // Debug logging - always log to help diagnose
  {
      console.log('[buildSuggestions] Country counting:', {
      totalArtists: artists.length,
      artistsWithCountry,
      artistsWithoutCountry,
      uniqueCountriesInData: Array.from(countriesInArtistData).slice(0, 10),
      sampleCountryCounts: Array.from(locationCounts.entries())
        .filter(([name]) => countriesInArtistData.has(name))
        .slice(0, 5),
    });
  }

  // Add all countries from the countries table, even if they don't have artists yet
  // This ensures all countries appear in suggestions, even if they have no artists
  if (allCountries && allCountries.length > 0) {
    console.log(`[buildSuggestions] Adding ${allCountries.length} countries from countries table`);
    allCountries.forEach((country) => {
      if (country.country_name && country.country_name !== "N/A") {
        const normalizedCountry = country.country_name.trim();
        // Use case-insensitive matching to handle "Canada" vs "canada" etc.
        const existingKey = Array.from(locationCounts.keys()).find(
          key => key.toLowerCase() === normalizedCountry.toLowerCase()
        );
        if (!existingKey) {
          // Country not found in artist data, add with 0 count
          locationCounts.set(normalizedCountry, 0);
          console.log(`[buildSuggestions] Added country "${normalizedCountry}" with 0 count`);
        } else if (existingKey !== normalizedCountry) {
          // If we found a match with different casing, merge the count and use the normalized name
          const count = locationCounts.get(existingKey) || 0;
          locationCounts.delete(existingKey);
          locationCounts.set(normalizedCountry, count);
          console.log(`[buildSuggestions] Merged country "${existingKey}" -> "${normalizedCountry}" with count ${count}`);
        }
        // If existingKey === normalizedCountry, the count is already correct, do nothing
      }
    });
  } else {
    console.warn('[buildSuggestions] No countries provided from allCountries!');
  }
  
  // Debug: Log country counts to help diagnose issues
  if (allCountries) {
    const countryEntries = Array.from(locationCounts.entries())
      .filter(([name]) => {
        // Check if this is a country from the countries table
        return allCountries.some(c => {
          const normalized = c.country_name?.trim();
          return normalized && normalized.toLowerCase() === name.toLowerCase();
        });
      })
      .map(([name, count]) => ({ name, count }));
    
    if (countryEntries.length > 0) {
      console.log('[buildSuggestions] Final country counts:', countryEntries.slice(0, 15));
      
      // Check for countries that should have artists but show 0
      const zeroCountCountries = countryEntries.filter(({ count }) => count === 0);
      if (zeroCountCountries.length > 0) {
        console.warn('[buildSuggestions] Countries with 0 artists (may indicate data issue):', 
          zeroCountCountries.slice(0, 10).map(c => c.name));
      }
    }
  }

  const uniqueLocations = Array.from(locationCounts.keys());
  const locationSuggestions: Suggestion[] = uniqueLocations.map(
    (location) => {
      const count = locationCounts.get(location) ?? 0; // Explicitly default to 0
      return {
        label: location,
        type: "location" as const,
        artistCount: count, // Always set artistCount, even if 0
      };
    }
  );

  // Debug: Log final location suggestions
  const countryNames = allCountries?.map(c => c.country_name.trim().toLowerCase()) || [];
  const locationCountries = locationSuggestions.filter(l => 
    countryNames.includes(l.label.toLowerCase())
  );
  
  console.log('[buildSuggestions] Final location suggestions:', {
    totalLocations: locationSuggestions.length,
    totalCountries: locationCountries.length,
    sampleLocations: locationSuggestions.slice(0, 10).map(l => ({ name: l.label, count: l.artistCount })),
    sampleCountries: locationCountries.slice(0, 10).map(l => ({ name: l.label, count: l.artistCount })),
    hasUnitedStates: locationSuggestions.some(l => l.label.toLowerCase().includes('united states')),
    hasUnitedKingdom: locationSuggestions.some(l => l.label.toLowerCase().includes('united kingdom')),
    hasCanada: locationSuggestions.some(l => l.label.toLowerCase().includes('canada')),
  });

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

