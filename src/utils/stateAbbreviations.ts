/**
 * Mapping of US state names to their two-letter abbreviations
 */
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY",
  "District of Columbia": "DC",
};

/**
 * Converts a US state name to its two-letter abbreviation if it's a US state
 * @param stateName - The full state name
 * @param countryName - The country name to check if it's USA
 * @returns The abbreviation if it's a US state, otherwise the original state name
 */
export function getStateAbbreviation(stateName: string | undefined | null, countryName: string | undefined | null): string {
  if (!stateName) {
    return "";
  }

  const trimmedStateName = stateName.trim();

  // If no country name or it's "N/A", try to abbreviate if the state is in our US states map
  // This handles cases where country might be missing but we know it's a US state
  if (!countryName || countryName === "N/A" || countryName.trim() === "") {
    // If the state name exists in our US states map, it's likely a US state, so abbreviate it
    // Try exact match first, then case-insensitive match
    if (US_STATE_ABBREVIATIONS[trimmedStateName]) {
      return US_STATE_ABBREVIATIONS[trimmedStateName];
    }
    // Try case-insensitive lookup
    const stateKey = Object.keys(US_STATE_ABBREVIATIONS).find(
      key => key.toLowerCase() === trimmedStateName.toLowerCase()
    );
    if (stateKey) {
      return US_STATE_ABBREVIATIONS[stateKey];
    }
    return trimmedStateName;
  }

  // Check if it's USA (case-insensitive, handle variations)
  const isUSA = /^united states|^usa|^u\.s\.|^u\.s\.a\./i.test(countryName.trim());
  
  if (!isUSA) {
    return trimmedStateName;
  }

  // Return abbreviation if found (try exact match, then case-insensitive)
  if (US_STATE_ABBREVIATIONS[trimmedStateName]) {
    return US_STATE_ABBREVIATIONS[trimmedStateName];
  }
  // Try case-insensitive lookup
  const stateKey = Object.keys(US_STATE_ABBREVIATIONS).find(
    key => key.toLowerCase() === trimmedStateName.toLowerCase()
  );
  if (stateKey) {
    return US_STATE_ABBREVIATIONS[stateKey];
  }
  return trimmedStateName;
}

/**
 * Converts country names to their abbreviations
 * @param countryName - The full country name
 * @returns The abbreviation if available, otherwise the original country name
 */
export function getCountryAbbreviation(countryName: string | undefined | null): string {
  if (!countryName) {
    return "";
  }

  const normalized = countryName.trim();

  // United Kingdom variations
  if (/^united kingdom|^uk$/i.test(normalized)) {
    return "UK";
  }

  // United States variations
  if (/^united states|^usa|^u\.s\.|^u\.s\.a\./i.test(normalized)) {
    return "USA";
  }

  // Return original if no abbreviation found
  return normalized;
}
