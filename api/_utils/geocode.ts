import type { SupabaseClient } from "@supabase/supabase-js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeCity(
  cityName: string,
  stateName: string | null,
  countryName: string | null
): Promise<{ lat: number; lng: number } | null> {
  const parts = [cityName, stateName, countryName].filter(Boolean);
  const query = parts.join(", ");

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "TradDirectory/1.0 (geocoding cities for tattoo artist directory)",
      },
    });

    if (!res.ok) {
      console.error(`Geocode HTTP ${res.status} for "${query}"`);
      return null;
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      console.warn(`Geocode: no results for "${query}"`);
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error(`Geocode error for "${query}":`, err);
    return null;
  }
}

// Geocode a full street address. Appends city/state/country context when the
// address doesn't already include the city, so partial addresses still resolve
// and same-named cities (Portland OR vs ME) disambiguate to the right place.
export async function geocodeAddress(
  address: string,
  cityName?: string | null,
  stateName?: string | null,
  countryName?: string | null
): Promise<{ lat: number; lng: number } | null> {
  const addr = (address || "").trim();
  if (!addr) return null;

  const context = [cityName, stateName, countryName].filter(Boolean).join(", ");
  const hasCity =
    !!cityName && addr.toLowerCase().includes(cityName.toLowerCase());
  const query = context && !hasCity ? `${addr}, ${context}` : addr;

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "TradDirectory/1.0 (geocoding shop addresses for tattoo directory)",
      },
    });
    if (!res.ok) {
      console.error(`Geocode HTTP ${res.status} for "${query}"`);
      return null;
    }
    const data = await res.json();
    if (!data || data.length === 0) {
      console.warn(`Geocode: no results for "${query}"`);
      return null;
    }
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    console.error(`Geocode error for "${query}":`, err);
    return null;
  }
}

// Resolve a shop's coordinates from its street address, pulling city/state/
// country context from the shop's city_id so partial addresses still land in
// the right place. Server-only (needs a Supabase client). Returns null when the
// address can't be geocoded.
type JoinCountry = { country_name: string | null };
type JoinState = {
  state_name: string | null;
  country: JoinCountry | JoinCountry[] | null;
};
type CityContext = {
  city_name: string | null;
  state: JoinState | JoinState[] | null;
};

export async function geocodeShopByCity(
  supabase: SupabaseClient,
  cityId: number,
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address || !cityId) return null;
  const { data } = await supabase
    .from("cities")
    .select(
      "city_name, state:states(state_name, country:countries(country_name))"
    )
    .eq("id", cityId)
    .single();
  // Supabase's untyped client returns loosely-typed rows for string selects.
  const city = data as CityContext | null;
  const state = Array.isArray(city?.state) ? city?.state[0] : city?.state;
  const country = Array.isArray(state?.country)
    ? state?.country[0]
    : state?.country;
  return geocodeAddress(
    address,
    city?.city_name ?? null,
    state?.state_name ?? null,
    country?.country_name ?? null
  );
}
