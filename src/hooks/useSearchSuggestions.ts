import { useState, useEffect, useRef } from "react";
import { fetchTattooShopsWithArtists, fetchAllCountries } from "../services/api";
import { buildSuggestions, type Suggestion } from "../utils/suggestions";

interface UseSearchSuggestionsOptions {
  /** Whether to fetch suggestions immediately on mount */
  autoFetch?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

interface UseSearchSuggestionsReturn {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Centralized hook for fetching search suggestions across the entire application.
 * Provides artists, shops, and locations in a unified interface.
 * 
 * @example
 * ```tsx
 * const { suggestions, loading, error } = useSearchSuggestions({ debug: true });
 * ```
 */
export function useSearchSuggestions(
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn {
  const { autoFetch = true, debug = false } = options;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[useSearchSuggestions] Fetching suggestions...");

      // Fetch both artists and countries in parallel
      const [artistsData, countriesData] = await Promise.all([
        fetchTattooShopsWithArtists(),
        fetchAllCountries().catch((err) => {
          // If countries fetch fails, log but don't block suggestions
          console.warn("[useSearchSuggestions] Failed to fetch countries:", err);
          return [];
        }),
      ]);

      console.log("[useSearchSuggestions] Data fetched:", {
        artistsCount: artistsData?.length || 0,
        countriesCount: countriesData?.length || 0,
      });

      if (artistsData) {
        const builtSuggestions = buildSuggestions(artistsData, countriesData);
        setSuggestions(builtSuggestions);

        const locationSuggestions = builtSuggestions.filter((s) => s.type === "location");
        const countrySuggestions = locationSuggestions.filter(s => {
          return countriesData?.some(c => 
            c.country_name?.trim().toLowerCase() === s.label.toLowerCase()
          );
        });

        console.log("[useSearchSuggestions] Loaded suggestions:", {
          total: builtSuggestions.length,
          artists: builtSuggestions.filter((s) => s.type === "artist").length,
          shops: builtSuggestions.filter((s) => s.type === "shop").length,
          locations: locationSuggestions.length,
          countries: countrySuggestions.length,
          sampleCountries: countrySuggestions.slice(0, 5).map(s => ({
            name: s.label,
            count: s.artistCount,
          })),
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error fetching suggestions.";
      setError(errorMessage);
      
      console.error("[useSearchSuggestions] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      fetchSuggestions();
    }
  }, [autoFetch]);

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions,
  };
}
