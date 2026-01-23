import { getStateAbbreviation, getCountryAbbreviation } from "./stateAbbreviations";

/**
 * Interface for artist location data
 */
export interface ArtistLocationData {
  city_name?: string | null;
  state_name?: string | null;
  country_name?: string | null;
  is_traveling?: boolean;
}

/**
 * Formats an artist's location string with proper abbreviations and traveling status.
 * 
 * - Filters out "N/A" and empty values
 * - Converts US state names to two-letter abbreviations
 * - Converts "United Kingdom" to "UK" and "United States" to "USA"
 * - Shows "Traveling" or "Traveling (from home city)" for traveling artists
 * - Returns empty string if no location data is available
 * 
 * @param locationData - The artist's location data
 * @returns Formatted location string, or empty string if no location
 */
export function formatArtistLocation(locationData: ArtistLocationData): string {
  const { city_name, state_name, country_name, is_traveling } = locationData;

  // Convert state and country names to abbreviations
  const formattedStateName = getStateAbbreviation(state_name, country_name);
  const formattedCountryName = getCountryAbbreviation(country_name);

  // Filter out "N/A" and empty values
  const locationParts = [city_name, formattedStateName, formattedCountryName]
    .filter(part => part && part !== "N/A" && typeof part === "string" && part.trim() !== "");
  
  const homeLocation = locationParts.join(", ");

  // Build final location string - show "Traveling" for traveling artists
  if (is_traveling) {
    return homeLocation 
      ? `Traveling (from ${homeLocation})` 
      : "Traveling";
  }

  return homeLocation;
}
