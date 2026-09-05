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
  const { autoFetch = true } = options;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch artists and countries in parallel; countries are best-effort.
      const [artistsData, countriesData] = await Promise.all([
        fetchTattooShopsWithArtists(),
        fetchAllCountries().catch(() => []),
      ]);

      if (artistsData) {
        setSuggestions(buildSuggestions(artistsData, countriesData));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error fetching suggestions."
      );
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
