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
