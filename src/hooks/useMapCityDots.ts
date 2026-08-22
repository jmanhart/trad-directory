import { useState, useEffect } from "react";
import type { CityDot } from "../components/map/MapView";

interface MapCity {
  id: number;
  city_name: string;
  state_name: string | null;
  country_name: string | null;
  continent: string | null;
  latitude: number;
  longitude: number;
  artist_count: number;
  shop_count: number;
}

// Session-level cache: /api/mapData is the sole geo source and rarely changes,
// so both /map and the search-results preview share a single fetch per session.
let cache: CityDot[] | null = null;
let inflight: Promise<CityDot[]> | null = null;

async function loadCityDots(): Promise<CityDot[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch("/api/mapData");
    const data = await res.json();
    const dots: CityDot[] = (data.cities || []).map((c: MapCity) => ({
      cityName: c.city_name,
      stateName: c.state_name,
      countryName: c.country_name,
      continent: c.continent,
      lat: c.latitude,
      lng: c.longitude,
      artistCount: c.artist_count,
      shopCount: c.shop_count,
    }));
    cache = dots;
    return dots;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/**
 * Shared accessor for the map city dots (coordinates + per-city counts).
 * Returns cached data synchronously on subsequent mounts within a session.
 */
export function useMapCityDots(): { cityDots: CityDot[]; loading: boolean } {
  const [cityDots, setCityDots] = useState<CityDot[]>(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setCityDots(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadCityDots()
      .then(dots => {
        if (cancelled) return;
        setCityDots(dots);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading map data:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { cityDots, loading };
}
