import { useState, useEffect } from "react";
import {
  fetchTattooShopsWithArtists,
  fetchTopCitiesByArtistCount,
} from "../services/api";
import { calculateTopCountries } from "../utils/statistics";
import { useSearchSuggestions } from "./useSearchSuggestions";

interface HomePageData {
  suggestions: ReturnType<typeof useSearchSuggestions>["suggestions"];
  topCities: Array<{ city_name: string; count: number }>;
  topCountries: Array<{ country_name: string; count: number }>;
  error: string | null;
  loading: boolean;
}

export function useHomePageData(): HomePageData {
  // Use centralized search suggestions hook
  const { suggestions, loading: suggestionsLoading, error: suggestionsError } =
    useSearchSuggestions({ autoFetch: true, debug: false });

  const [error, setError] = useState<string | null>(null);
  const [topCities, setTopCities] = useState<
    Array<{ city_name: string; count: number }>
  >([]);
  const [topCountries, setTopCountries] = useState<
    Array<{ country_name: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch cities data and calculate countries
        const [artistsData, citiesData] = await Promise.all([
          fetchTattooShopsWithArtists(),
          fetchTopCitiesByArtistCount(5),
        ]);

        if (artistsData) {
          setTopCountries(calculateTopCountries(artistsData, 5));
        }

        setTopCities(citiesData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error fetching data.";
        setError(errorMessage);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return {
    suggestions,
    topCities,
    topCountries,
    error: error || suggestionsError,
    loading: loading || suggestionsLoading,
  };
}

