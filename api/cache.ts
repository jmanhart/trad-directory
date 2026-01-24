// Cache configuration
const CACHE_TTL = {
  SEARCH_RESULTS: 900, // 15 minutes
  ARTIST_DETAILS: 3600, // 1 hour
  CITY_DATA: 1800, // 30 minutes
  SHOP_DATA: 1800, // 30 minutes
  POPULAR_SEARCHES: 3600, // 1 hour
};

// Try to import Redis, but make it optional
let Redis: any = null;
let redisAvailable = false;

try {
  Redis = require("ioredis");
  redisAvailable = true;
} catch (error) {
  console.warn("Redis (ioredis) not available, caching disabled:", error);
  redisAvailable = false;
}

// Initialize Redis/Valkey client
let redisClient: any = null;

function getRedisClient() {
  if (!redisAvailable) {
    return null;
  }
  
  if (!redisClient) {
    try {
      const redisUrl =
        process.env.REDIS_URL ||
        process.env.VALKEY_URL ||
        "redis://localhost:6379";
      redisClient = new Redis(redisUrl, {
        connectTimeout: 5000,
        lazyConnect: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      // Handle connection errors gracefully
      redisClient.on("error", (err: any) => {
        console.warn("Redis/Valkey connection error:", err.message);
      });
    } catch (error) {
      console.warn("Failed to initialize Redis client:", error);
      redisAvailable = false;
      return null;
    }
  }
  return redisClient;
}

// Cache utility functions
export class CacheManager {
  private client = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      return null; // Cache not available
    }
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<boolean> {
    if (!this.client) {
      return false; // Cache not available
    }
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client) {
      return false; // Cache not available
    }
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Cache key generators
  static searchKey(query: string): string {
    return `search:artists:${query.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  }

  static artistKey(id: string | number): string {
    return `artist:${id}`;
  }

  static citiesKey(includeArtists: boolean = false): string {
    return `cities:${includeArtists ? "with_artists" : "stats"}`;
  }

  static shopsKey(query?: string): string {
    return query ? `shops:search:${query.toLowerCase()}` : "shops:all";
  }

  static popularSearchesKey(): string {
    return "popular:searches";
  }
}

// Cache wrapper function for API endpoints
export async function withCache<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetchFunction: () => Promise<T>
): Promise<T> {
  const cache = new CacheManager();

  // Try to get from cache first
  const cached = await cache.get<T>(cacheKey);
  if (cached) {
    console.log(`Cache HIT for key: ${cacheKey}`);
    return cached;
  }

  console.log(`Cache MISS for key: ${cacheKey}`);

  // Fetch fresh data
  const data = await fetchFunction();

  // Cache the result
  await cache.set(cacheKey, data, ttlSeconds);

  return data;
}

// Cache invalidation helpers
export async function invalidateArtistCache(artistId: string | number) {
  const cache = new CacheManager();
  await cache.del(CacheManager.artistKey(artistId));
  // Also invalidate search caches that might contain this artist
  // This is a simple approach - in production you might want more sophisticated invalidation
}

export async function invalidateSearchCache() {
  const cache = new CacheManager();
  const client = getRedisClient();
  if (!client) {
    return; // Cache not available
  }
  // Get all search keys and delete them
  // Note: This is a simplified approach. In production, you'd want to use SCAN
  try {
    const keys = await client.keys("search:artists:*");
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.warn("Error invalidating search cache:", error);
  }
}

export { CACHE_TTL };