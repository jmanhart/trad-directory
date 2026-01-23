import { useState, useEffect, useRef } from "react";
import { fetchTattooShopsWithArtists } from "../services/api";
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

      if (debug) {
        console.debug("[useSearchSuggestions] Fetching suggestions...");
      }

      const artistsData = await fetchTattooShopsWithArtists();

      if (artistsData) {
        const builtSuggestions = buildSuggestions(artistsData);
        setSuggestions(builtSuggestions);

        if (debug) {
          console.debug("[useSearchSuggestions] Loaded suggestions:", {
            total: builtSuggestions.length,
            artists: builtSuggestions.filter((s) => s.type === "artist").length,
            shops: builtSuggestions.filter((s) => s.type === "shop").length,
            locations: builtSuggestions.filter((s) => s.type === "location").length,
          });
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error fetching suggestions.";
      setError(errorMessage);
      
      if (debug) {
        console.error("[useSearchSuggestions] Error:", err);
      }
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
