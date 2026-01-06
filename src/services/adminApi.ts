interface AddArtistData {
  name: string;
  instagram_handle?: string;
  city_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_id?: number;
}

/**
 * Add an artist to the database via the server-side API
 * This uses the API endpoint which has access to the service key
 */
export async function addArtist(data: AddArtistData): Promise<number> {
  try {
    // Use relative path - works in production on Vercel
    // For local dev, run `vercel dev` to start the API server
    const apiUrl = import.meta.env.VITE_API_URL || "/api/addArtist";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.details || errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result.artist_id;
  } catch (error) {
    console.error("Error adding artist:", error);
    throw error;
  }
}

/**
 * Fetch all countries for dropdown
 */
export async function fetchCountries(): Promise<{ id: number; country_name: string }[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/listCountries";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status}`);
    }

    const result = await response.json();
    return result.countries || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
}

/**
 * Fetch all cities with their state and country info for dropdown
 */
export async function fetchCities(): Promise<
  {
    id: number;
    city_name: string;
    state_id: number | null;
    state_name: string | null;
    country_id: number | null;
    country_name: string | null;
  }[]
> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/listCities";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`);
    }

    const result = await response.json();
    return result.cities || [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
}

/**
 * Fetch all shops for dropdown
 */
export async function fetchShops(): Promise<{ id: number; shop_name: string }[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/listShops";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch shops: ${response.status}`);
    }

    const result = await response.json();
    return result.shops || [];
  } catch (error) {
    console.error("Error fetching shops:", error);
    throw error;
  }
}
