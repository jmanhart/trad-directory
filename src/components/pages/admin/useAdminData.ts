/**
 * Custom hook for loading admin data (cities, shops, states, artists)
 */

import { useState, useEffect } from "react";
import {
  fetchCities,
  fetchShops,
  fetchStates,
  fetchArtists,
} from "../../../services/adminApi";
import { City, Shop, State, Artist, MessageType } from "./adminTypes";

interface UseAdminDataOptions {
  loadCities?: boolean;
  loadShops?: boolean;
  loadStates?: boolean;
  loadArtists?: boolean;
}

interface UseAdminDataReturn {
  cities: City[];
  shops: Shop[];
  states: State[];
  artists: Artist[];
  loading: boolean;
  error: MessageType;
}

export function useAdminData(options: UseAdminDataOptions = {}): UseAdminDataReturn {
  const {
    loadCities = false,
    loadShops = false,
    loadStates = false,
    loadArtists = false,
  } = options;

  const [cities, setCities] = useState<City[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MessageType>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const promises: Promise<any>[] = [];

        if (loadCities) promises.push(fetchCities());
        if (loadShops) promises.push(fetchShops());
        if (loadStates) promises.push(fetchStates());
        if (loadArtists) promises.push(fetchArtists());

        const results = await Promise.all(promises);

        let resultIndex = 0;
        if (loadCities) {
          setCities(results[resultIndex++]);
        }
        if (loadShops) {
          setShops(results[resultIndex++]);
        }
        if (loadStates) {
          setStates(results[resultIndex++]);
        }
        if (loadArtists) {
          setArtists(results[resultIndex++]);
        }
      } catch (err) {
        setError({
          type: "error",
          text: `Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadCities, loadShops, loadStates, loadArtists]);

  return { cities, shops, states, artists, loading, error };
}
