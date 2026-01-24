interface AddArtistData {
  name: string;
  instagram_handle?: string;
  gender?: string;
  url?: string;
  contact?: string;
  city_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_id?: number;
  is_traveling?: boolean;
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

interface AddShopData {
  shop_name: string;
  instagram_handle?: string;
  address?: string;
  contact?: string;
  phone_number?: string;
  website_url?: string;
  city_id: number;
}

/**
 * Add a shop to the database via the server-side API
 */
export async function addShop(data: AddShopData): Promise<number> {
  try {
    // Use relative path - works in production on Vercel
    // For local dev, run `vercel dev` to start the API server
    const apiUrl = import.meta.env.VITE_API_URL || "/api/addShop";

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
    return result.shop_id;
  } catch (error) {
    console.error("Error adding shop:", error);
    throw error;
  }
}

/**
 * Fetch all states with their country info for dropdown
 */
export async function fetchStates(): Promise<
  {
    id: number;
    state_name: string;
    country_id: number | null;
    country_name: string | null;
  }[]
> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/listStates";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status}`);
    }

    const result = await response.json();
    return result.states || [];
  } catch (error) {
    console.error("Error fetching states:", error);
    throw error;
  }
}

interface AddCityData {
  city_name: string;
  state_id?: number | null;
}

/**
 * Add a city to the database via the server-side API
 */
export async function addCity(data: AddCityData): Promise<number> {
  try {
    // Use relative path - works in production on Vercel
    // For local dev, run `vercel dev` to start the API server
    const apiUrl = import.meta.env.VITE_API_URL || "/api/addCity";

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
    return result.city_id;
  } catch (error) {
    console.error("Error adding city:", error);
    throw error;
  }
}

interface AddCountryData {
  country_name: string;
  country_code?: string;
}

/**
 * Add a country to the database via the server-side API
 */
export async function addCountry(data: AddCountryData): Promise<number> {
  try {
    // Use relative path - works in production on Vercel
    // For local dev, run `vercel dev` to start the API server
    const apiUrl = import.meta.env.VITE_API_URL || "/api/addCountry";

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
    return result.country_id;
  } catch (error) {
    console.error("Error adding country:", error);
    throw error;
  }
}

/**
 * Fetch all artists for dropdown
 */
export async function fetchArtists(): Promise<
  { id: number; name: string; instagram_handle: string | null }[]
> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/listArtists";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch artists: ${response.status}`);
    }

    const result = await response.json();
    return result.artists || [];
  } catch (error) {
    console.error("Error fetching artists:", error);
    throw error;
  }
}

interface UpdateArtistData {
  id: number;
  name?: string;
  instagram_handle?: string;
  gender?: string;
  url?: string;
  contact?: string;
  city_id?: number;
  shop_id?: number;
  is_traveling?: boolean;
}

/**
 * Update an artist in the database via the server-side API
 */
export async function updateArtist(data: UpdateArtistData): Promise<void> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/updateArtist";

    const response = await fetch(apiUrl, {
      method: "PUT",
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
  } catch (error) {
    console.error("Error updating artist:", error);
    throw error;
  }
}

/**
 * Fetch a single artist by ID with full details
 */
export async function fetchArtistById(id: number): Promise<any> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || `/api/artists/${id}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.details || errorData.error || `Failed to fetch artist: ${response.status}`
      );
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error("Error fetching artist:", error);
    throw error;
  }
}

interface UpdateShopData {
  id: number;
  shop_name?: string;
  instagram_handle?: string;
  address?: string;
  contact?: string;
  phone_number?: string;
  website_url?: string;
  city_id?: number;
}

/**
 * Update a shop in the database via the server-side API
 */
export async function updateShop(data: UpdateShopData): Promise<void> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/updateShop";

    const response = await fetch(apiUrl, {
      method: "PUT",
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
  } catch (error) {
    console.error("Error updating shop:", error);
    throw error;
  }
}

/**
 * Fetch a single shop by ID with full details
 */
export async function fetchShopById(id: number): Promise<any> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || `/api/shops/${id}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.details || errorData.error || `Failed to fetch shop: ${response.status}`
      );
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error("Error fetching shop:", error);
    throw error;
  }
}

interface AddArtistShopLinkData {
  artist_id: number;
  shop_id: number;
}

/**
 * Add an artist-shop link to the database via the server-side API
 */
export async function addArtistShopLink(
  data: AddArtistShopLinkData
): Promise<void> {
  try {
    // Use relative path - works in production on Vercel
    // For local dev, run `vercel dev` to start the API server
    const apiUrl = import.meta.env.VITE_API_URL || "/api/addArtistShopLink";

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
  } catch (error) {
    console.error("Error adding artist-shop link:", error);
    throw error;
  }
}

interface BrokenLink {
  url: string;
  handle: string;
  type: "artist" | "shop";
  id: number;
  name: string;
  status: number | null;
  error: string | null;
}

interface CheckLinksResponse {
  brokenLinks: BrokenLink[];
  totalChecked: number;
  brokenCount: number;
}

/**
 * Check Instagram links and return only broken ones (not status 200)
 */
export async function checkInstagramLinks(): Promise<CheckLinksResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "/api/checkInstagramLinks";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to check links: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error checking Instagram links:", error);
    throw error;
  }
}
