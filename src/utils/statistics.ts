export interface CountItem {
  name: string;
  count: number;
}

/**
 * Calculates top items by count from artist data
 * @param artists - Array of artists
 * @param getKey - Function to extract the key to count by
 * @param limit - Maximum number of results to return
 * @returns Sorted array of items with counts
 */
export function calculateTopByCount<T>(
  artists: T[],
  getKey: (artist: T) => string,
  limit: number = 5
): CountItem[] {
  const counts = new Map<string, number>();

  for (const artist of artists) {
    const key = getKey(artist) || "N/A";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Calculates top countries by artist count
 */
export function calculateTopCountries(
  artists: Array<{ country_name?: string }>,
  limit: number = 5
): Array<{ country_name: string; count: number }> {
  return calculateTopByCount(
    artists,
    (artist) => artist.country_name || "N/A",
    limit
  ).map((item) => ({
    country_name: item.name,
    count: item.count,
  }));
}

