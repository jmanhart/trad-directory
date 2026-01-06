import { useState, useEffect } from "react";
import {
  fetchTattooShopsWithArtists,
  fetchTopCitiesByArtistCount,
} from "../services/api";
import { buildSuggestions, type Suggestion } from "../utils/suggestions";
import { calculateTopCountries } from "../utils/statistics";

interface HomePageData {
  suggestions: Suggestion[];
  topCities: Array<{ city_name: string; count: number }>;
  topCountries: Array<{ country_name: string; count: number }>;
  error: string | null;
  loading: boolean;
}

export function useHomePageData(): HomePageData {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
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

        // Fetch both in parallel
        const [artistsData, citiesData] = await Promise.all([
          fetchTattooShopsWithArtists(),
          fetchTopCitiesByArtistCount(5),
        ]);

        if (artistsData) {
          setSuggestions(buildSuggestions(artistsData));
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
    error,
    loading,
  };
}

