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

interface MapShop {
  id: number;
  shop_name: string;
  city_id: number;
  latitude: number;
  longitude: number;
}

export interface ShopDot {
  id: number;
  shopName: string;
  lat: number;
  lng: number;
}

// Session-level cache: /api/mapData is the sole geo source and rarely changes,
// so both /map and the search-results preview share a single fetch per session.
let cache: { cityDots: CityDot[]; shopDots: ShopDot[] } | null = null;
let inflight: Promise<{ cityDots: CityDot[]; shopDots: ShopDot[] }> | null = null;

async function loadMapData() {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch("/api/mapData");
    const data = await res.json();
    const cityDots: CityDot[] = (data.cities || []).map((c: MapCity) => ({
      cityName: c.city_name,
      stateName: c.state_name,
      countryName: c.country_name,
      continent: c.continent,
      lat: c.latitude,
      lng: c.longitude,
      artistCount: c.artist_count,
      shopCount: c.shop_count,
    }));
    const shopDots: ShopDot[] = (data.shops || []).map((s: MapShop) => ({
      id: s.id,
      shopName: s.shop_name,
      lat: s.latitude,
      lng: s.longitude,
    }));
    cache = { cityDots, shopDots };
    return cache;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/**
 * Shared accessor for map data: city dots (coords + per-city counts) and
 * shop pins (shops with geocoded coordinates). Cached per session.
 */
export function useMapCityDots(): {
  cityDots: CityDot[];
  shopDots: ShopDot[];
  loading: boolean;
} {
  const [data, setData] = useState<{ cityDots: CityDot[]; shopDots: ShopDot[] }>(
    cache || { cityDots: [], shopDots: [] }
  );
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setData(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadMapData()
      .then(d => {
        if (cancelled) return;
        setData(d);
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

  return { cityDots: data.cityDots, shopDots: data.shopDots, loading };
}
