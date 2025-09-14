// MCP API service - replaces direct Supabase calls with MCP endpoints

// Use local API for development, production API for deployed app
const MCP_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000/api" // Local development
  : "https://www.trad-directory.com/api"; // Production

console.log("MCP_BASE_URL:", MCP_BASE_URL, "DEV:", import.meta.env.DEV);

// Helper function to make API calls with fallback
async function mcpRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${MCP_BASE_URL}${endpoint}`;
  console.log("Making MCP request to:", url);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    console.log("MCP request successful:", url);
    return response.json();
  } catch (error) {
    console.warn(
      `MCP API request failed, falling back to direct Supabase: ${error}`
    );
    throw error; // Re-throw to trigger fallback in calling functions
  }
}

// Fallback to original Supabase API
async function fallbackToSupabase() {
  const { fetchTattooShopsWithArtists: originalFetch } = await import("./api");
  return originalFetch();
}

// Fetch all artists (replaces fetchTattooShopsWithArtists)
export async function fetchTattooShopsWithArtists() {
  try {
    const data = await mcpRequest("/artists?limit=1000"); // Get all artists

    // Transform the response to match the expected format
    return data.results.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      instagram_handle: artist.instagram_handle,
      city_name: artist.city_name || "N/A",
      state_name: artist.state_name || "N/A",
      country_name: artist.country_name || "N/A",
      shop_id: null, // We'll need to add this to the MCP endpoint
      shop_name: "N/A", // We'll need to add this to the MCP endpoint
      shop_instagram_handle: null, // We'll need to add this to the MCP endpoint
    }));
  } catch (error) {
    console.warn("MCP API failed, falling back to direct Supabase");
    return fallbackToSupabase();
  }
}

// Fetch an individual artist by ID
export async function fetchArtistById(id: number) {
  try {
    const data = await mcpRequest(`/artists/${id}`);

    // Transform the response to match the expected format
    const artist = data.result;
    return {
      id: artist.id,
      name: artist.name,
      instagram_handle: artist.instagram_handle,
      city_name: artist.city_name || "N/A",
      state_name: artist.state_name || "N/A",
      country_name: artist.country_name || "N/A",
      shop_id: artist.shop?.id || null,
      shop_name: artist.shop?.shop_name || "N/A",
      shop_instagram_handle: artist.shop?.instagram_handle || null,
    };
  } catch (error) {
    console.warn(
      `MCP API failed for artist ${id}, falling back to direct Supabase`
    );
    const { fetchArtistById: originalFetch } = await import("./api");
    return originalFetch(id);
  }
}

// Fetch an individual shop by ID
export async function fetchShopById(id: number) {
  try {
    const data = await mcpRequest(`/shops?query=&limit=1000`); // Get all shops for now

    // Find the specific shop (we'll need to add a /shops/[id] endpoint)
    const shop = data.results.find((s: any) => s.id === id);

    if (!shop) {
      throw new Error(`Shop with ID ${id} not found`);
    }

    return {
      id: shop.id,
      shop_name: shop.shop_name,
      address: shop.address,
      city_name: shop.city_name || "N/A",
      state_name: shop.state_name || "N/A",
      country_name: shop.country_name || "N/A",
      artists: [], // We'll need to add this to the MCP endpoint
    };
  } catch (error) {
    console.error(`Error fetching shop ${id} from MCP:`, error);
    throw error;
  }
}

// Search artists (new function using MCP search endpoint)
export async function searchArtists(query: string) {
  try {
    const data = await mcpRequest(
      `/searchArtists?query=${encodeURIComponent(query)}`
    );

    // Transform the response to match the expected format
    const transformed = data.results.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      instagram_handle: artist.instagram_handle,
      city_name: artist.city_name || "N/A",
      state_name: artist.state_name || "N/A",
      country_name: artist.country_name || "N/A",
      shop_id: artist.shop_id || null,
      shop_name: artist.shop_name || "N/A",
      shop_instagram_handle: artist.shop_instagram_handle || null,
    }));
    return transformed;
  } catch (error) {
    console.warn("MCP search failed, falling back to client-side search");
    // Fallback to client-side search using original API
    const allArtists = await fallbackToSupabase();
    const normalizedQuery = query.toLowerCase().replace(/^@/, "");
    const filtered = allArtists.filter(
      (artist: any) =>
        artist.name?.toLowerCase().includes(normalizedQuery) ||
        artist.instagram_handle?.toLowerCase().includes(normalizedQuery) ||
        artist.shop_name?.toLowerCase().includes(normalizedQuery) ||
        artist.city_name?.toLowerCase().includes(normalizedQuery) ||
        artist.state_name?.toLowerCase().includes(normalizedQuery) ||
        artist.country_name?.toLowerCase().includes(normalizedQuery)
    );
    return filtered;
  }
}

// Compute top cities by artist count
export async function fetchTopCitiesByArtistCount(limit: number = 5) {
  try {
    const data = await mcpRequest(`/cities?include_artists=false&limit=1000`);

    return data.results
      .map((city: any) => ({
        city_name: city.city_name,
        count: city.artist_count,
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.warn("MCP API failed for cities, falling back to direct Supabase");
    const { fetchTopCitiesByArtistCount: originalFetch } = await import(
      "./api"
    );
    return originalFetch(limit);
  }
}
