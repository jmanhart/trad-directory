import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { fetchTattooShopsWithArtists } from "../../services/api";
import type { Artist } from "../../types/entities";
import useIsMobile from "../../hooks/useIsMobile";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import type { Suggestion } from "../../utils/suggestions";
import MapView, { CityDot } from "../../components/map/MapView";
import CityDetailCard from "../../components/map/CityDetailCard";
import SearchBar from "../../components/common/SearchBar";
import styles from "./MapPage.module.css";

interface MapCity {
  id: number;
  city_name: string;
  state_name: string | null;
  country_name: string | null;
  latitude: number;
  longitude: number;
  artist_count: number;
  shop_count: number;
}

export default function MapPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { suggestions } = useSearchSuggestions();
  const [cityDots, setCityDots] = useState<CityDot[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<CityDot | null>(null);

  // flyTo state for programmatic map navigation
  const [flyTo, setFlyTo] = useState<{
    coordinates: [number, number];
    zoom: number;
  } | null>(null);
  const [flyToKey, setFlyToKey] = useState(0);

  // Lazily loaded full artist data for city detail card
  const [allArtists, setAllArtists] = useState<Artist[] | null>(null);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const artistsFetchedRef = useRef(false);

  // Track which query we last processed to avoid re-processing
  const lastProcessedQuery = useRef<string | null>(null);

  // Fast initial load — just city dots with counts
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/mapData");
        const data = await res.json();
        const dots: CityDot[] = (data.cities || []).map((c: MapCity) => ({
          cityName: c.city_name,
          stateName: c.state_name,
          countryName: c.country_name,
          lat: c.latitude,
          lng: c.longitude,
          artistCount: c.artist_count,
          shopCount: c.shop_count,
        }));
        setCityDots(dots);
      } catch (err) {
        console.error("Error loading map data:", err);
      }
    }
    load();
  }, []);

  // Watch URL params to fly to a city
  // Supports ?city=X&state=Y (deep link) or ?q=X (search from top bar)
  useEffect(() => {
    if (cityDots.length === 0) return;

    const cityParam = searchParams.get("city");
    const stateParam = searchParams.get("state");
    const qParam = searchParams.get("q");

    // Deep link: ?city=X&state=Y
    if (cityParam) {
      const key = `city:${cityParam}|${stateParam || ""}`;
      if (lastProcessedQuery.current === key) return;
      lastProcessedQuery.current = key;

      const match = cityDots.find(
        d =>
          d.cityName.toLowerCase() === cityParam.toLowerCase() &&
          (!stateParam ||
            (d.stateName || "").toLowerCase() ===
              stateParam.toLowerCase())
      );
      if (match) {
        setSelectedCity(match);
        setFlyTo({ coordinates: [match.lng, match.lat], zoom: 6 });
        setFlyToKey(k => k + 1);
        ensureArtistsLoaded();
      }
      return;
    }

    // Search from top bar: ?q=X
    if (qParam) {
      const key = `q:${qParam}`;
      if (lastProcessedQuery.current === key) return;
      lastProcessedQuery.current = key;

      const q = qParam.toLowerCase();

      // Check if query matches a country or state (region with multiple dots)
      const countryDots = cityDots.filter(
        d => (d.countryName || "").toLowerCase() === q
      );
      const stateDots = cityDots.filter(
        d => (d.stateName || "").toLowerCase() === q
      );
      const regionDots =
        countryDots.length > 0
          ? countryDots
          : stateDots.length > 0
            ? stateDots
            : null;

      if (regionDots && regionDots.length > 0) {
        // Zoom to bounding box of all dots in the region
        const lats = regionDots.map(d => d.lat);
        const lngs = regionDots.map(d => d.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const latSpread = Math.max(...lats) - Math.min(...lats);
        const lngSpread = Math.max(...lngs) - Math.min(...lngs);
        const spread = Math.max(latSpread, lngSpread, 1);

        let zoom: number;
        if (spread > 30) zoom = 2;
        else if (spread > 15) zoom = 3;
        else if (spread > 8) zoom = 4;
        else if (spread > 3) zoom = 5;
        else zoom = 6;

        setSelectedCity(null);
        setSelectedCountry(
          countryDots.length > 0
            ? regionDots[0].countryName
            : regionDots[0].stateName
        );
        setFlyTo({ coordinates: [centerLng, centerLat], zoom });
        setFlyToKey(k => k + 1);
        return;
      }

      // Try exact city name match first, then partial
      const exact = cityDots.find(
        d => d.cityName.toLowerCase() === q
      );
      const partial =
        exact ||
        cityDots.find(d => d.cityName.toLowerCase().includes(q));

      if (partial) {
        setSelectedCity(partial);
        setFlyTo({
          coordinates: [partial.lng, partial.lat],
          zoom: 6,
        });
        setFlyToKey(k => k + 1);
        ensureArtistsLoaded();
      }
      return;
    }

    // No params — clear any previous tracking
    lastProcessedQuery.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityDots, searchParams]);

  // Sync URL params when selectedCity changes (user clicks a dot)
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    if (selectedCity) {
      const params: Record<string, string> = {
        city: selectedCity.cityName,
      };
      if (selectedCity.stateName) params.state = selectedCity.stateName;
      lastProcessedQuery.current = `city:${params.city}|${params.state || ""}`;
      setSearchParams(params, { replace: true });
    } else {
      lastProcessedQuery.current = null;
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // Escape key to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCity(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Fetch full artist data on first city click
  const ensureArtistsLoaded = useCallback(async () => {
    if (artistsFetchedRef.current || allArtists) return;
    artistsFetchedRef.current = true;
    setLoadingArtists(true);
    try {
      const data = await fetchTattooShopsWithArtists();
      setAllArtists(data);
    } catch (err) {
      console.error("Error loading artists:", err);
      artistsFetchedRef.current = false;
    } finally {
      setLoadingArtists(false);
    }
  }, [allArtists]);

  // Get artists and shops for the selected city
  const norm = (v: string | null | undefined) => {
    if (!v || v === "N/A") return "";
    return v.trim().toLowerCase();
  };

  const cityArtists = useMemo(() => {
    if (!selectedCity || !allArtists) return [];
    const cityKey = `${norm(selectedCity.cityName)}|${norm(selectedCity.stateName)}`;

    return allArtists.filter(artist => {
      const locations = artist.locations?.length
        ? artist.locations
        : [
            {
              city_name: artist.city_name,
              state_name: artist.state_name,
              country_name: artist.country_name,
              is_primary: true,
            },
          ];
      return locations.some(
        loc =>
          `${norm(loc.city_name)}|${norm(loc.state_name)}` === cityKey
      );
    });
  }, [selectedCity, allArtists]);

  const cityShops = useMemo(() => {
    if (!selectedCity || !allArtists) return [];
    const cityKey = `${norm(selectedCity.cityName)}|${norm(selectedCity.stateName)}`;

    const shopMap = new Map<
      number,
      { id: number; shop_name: string; slug?: string | null }
    >();
    allArtists.forEach(artist => {
      const locations = artist.locations?.length ? artist.locations : [];
      locations.forEach(loc => {
        if (
          loc.shop_id &&
          loc.shop_name &&
          `${norm(loc.city_name)}|${norm(loc.state_name)}` === cityKey
        ) {
          shopMap.set(loc.shop_id, {
            id: loc.shop_id,
            shop_name: loc.shop_name,
            slug: loc.shop_slug,
          });
        }
      });
    });
    return Array.from(shopMap.values());
  }, [selectedCity, allArtists]);

  // Stats for the info card
  const displayDots = selectedCountry
    ? cityDots.filter(d => d.countryName === selectedCountry)
    : cityDots;
  const totalCities = displayDots.length;
  const totalArtists = displayDots.reduce(
    (s, d) => s + d.artistCount,
    0
  );

  const handleCityClick = useCallback(
    (city: CityDot) => {
      const isToggleOff =
        selectedCity?.cityName === city.cityName &&
        selectedCity?.stateName === city.stateName;

      if (isToggleOff) {
        setSelectedCity(null);
      } else {
        setSelectedCity(city);
        ensureArtistsLoaded();
      }
    },
    [selectedCity, ensureArtistsLoaded]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedCity(null);
  }, []);

  // Location-only suggestions for the map search
  const mapSuggestions = useMemo(
    () => suggestions.filter(s => s.type === "location"),
    [suggestions]
  );

  const handleMapSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        navigate(`/map?q=${encodeURIComponent(query.trim())}`, {
          replace: true,
        });
      }
    },
    [navigate]
  );

  const handleMapSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      navigate(`/map?q=${encodeURIComponent(suggestion.label)}`, {
        replace: true,
      });
    },
    [navigate]
  );

  return (
    <div className={styles.container}>
      <div className={styles.mapOverlay}>
        <Link to="/" className={styles.overlayLogo}>
          <img src="/TRAD-NEW-SMALL.svg" alt="TRAD" />
        </Link>
        <div className={styles.overlaySearch}>
          <SearchBar
            size="compact"
            onSearch={handleMapSearch}
            suggestions={mapSuggestions}
            onSelectSuggestion={handleMapSelectSuggestion}
            placeholder="Search cities on map..."
          />
        </div>
      </div>
      <MapView
        cityData={cityDots}
        onCountrySelect={setSelectedCountry}
        onCityClick={handleCityClick}
        selectedCity={selectedCity}
        flyTo={flyTo}
        flyToKey={flyToKey}
        onBackgroundClick={handleBackgroundClick}
      />

      {!selectedCity && (
        <div className={styles.infoCard}>
          <h1 className={styles.infoTitle}>
            {selectedCountry || "Artist Map"}
          </h1>
          <p className={styles.infoSubtitle}>
            {totalCities} {totalCities === 1 ? "city" : "cities"}{" "}
            &middot; {totalArtists}{" "}
            {totalArtists === 1 ? "artist" : "artists"}
          </p>
        </div>
      )}

      {selectedCity && !isMobile && (
        <div className={styles.sidePanel}>
          <CityDetailCard
            cityName={selectedCity.cityName}
            stateName={selectedCity.stateName}
            countryName={selectedCity.countryName}
            artists={cityArtists}
            shops={cityShops}
            loading={loadingArtists}
            onClose={() => setSelectedCity(null)}
          />
        </div>
      )}

      {selectedCity && isMobile && (
        <>
          <div
            className={styles.mobileBackdrop}
            onClick={() => setSelectedCity(null)}
          />
          <div className={styles.mobileSheet}>
            <CityDetailCard
              cityName={selectedCity.cityName}
              stateName={selectedCity.stateName}
              countryName={selectedCity.countryName}
              artists={cityArtists}
              shops={cityShops}
              loading={loadingArtists}
              onClose={() => setSelectedCity(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
