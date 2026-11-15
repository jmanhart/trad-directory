/**
 * Custom hook for loading admin data (cities, shops, states, artists, genders)
 */

import { useState, useEffect } from "react";
import {
  fetchCities,
  fetchShops,
  fetchStates,
  fetchArtists,
  listGenders,
  GenderOption,
} from "../../../services/adminApi";
import { City, Shop, State, Artist, MessageType } from "./adminTypes";

interface UseAdminDataOptions {
  loadCities?: boolean;
  loadShops?: boolean;
  loadStates?: boolean;
  loadArtists?: boolean;
  loadGenders?: boolean;
}

interface UseAdminDataReturn {
  cities: City[];
  shops: Shop[];
  states: State[];
  artists: Artist[];
  genders: GenderOption[];
  loading: boolean;
  error: MessageType;
  refetch: () => Promise<void>;
}

export function useAdminData(
  options: UseAdminDataOptions = {}
): UseAdminDataReturn {
  const {
    loadCities = false,
    loadShops = false,
    loadStates = false,
    loadArtists = false,
    loadGenders = false,
  } = options;

  const [cities, setCities] = useState<City[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genders, setGenders] = useState<GenderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MessageType>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises: Promise<any>[] = [];

      if (loadCities) promises.push(fetchCities());
      if (loadShops) promises.push(fetchShops());
      if (loadStates) promises.push(fetchStates());
      if (loadArtists) promises.push(fetchArtists());
      if (loadGenders) promises.push(listGenders());

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
      if (loadGenders) {
        setGenders(results[resultIndex++]);
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

  useEffect(() => {
    loadData();
  }, [loadCities, loadShops, loadStates, loadArtists, loadGenders]);

  return {
    cities,
    shops,
    states,
    artists,
    genders,
    loading,
    error,
    refetch: loadData,
  };
}
