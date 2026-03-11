import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { fetchTattooShopsWithArtists } from "../../services/api";
import type { Artist } from "../../types/entities";
import useIsMobile from "../../hooks/useIsMobile";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import type { Suggestion } from "../../utils/suggestions";
import MapView, { CityDot } from "../../components/map/MapView";
import MapDetailPanel from "../../components/map/MapDetailPanel";
import SearchBar from "../../components/common/SearchBar";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
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

interface SelectedRegion {
  name: string;
  type: "state" | "country";
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
  const [selectedRegion, setSelectedRegion] =
    useState<SelectedRegion | null>(null);

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

  // Pending artist/shop suggestion to process once allArtists loads
  const pendingSuggestionRef = useRef<Suggestion | null>(null);

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
        setSelectedRegion(null);
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
        if (countryDots.length > 0) {
          setSelectedCountry(regionDots[0].countryName);
          setSelectedRegion(null);
        } else {
          setSelectedRegion({
            name: regionDots[0].stateName!,
            type: "state",
          });
          ensureArtistsLoaded();
        }
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
        setSelectedRegion(null);
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
    } else if (!selectedRegion) {
      lastProcessedQuery.current = null;
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // Escape key to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCity(null);
        setSelectedRegion(null);
      }
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

  // Region-level data (artists, shops, dots in the region)
  const regionCityDots = useMemo(() => {
    if (!selectedRegion) return [];
    return cityDots.filter(d => {
      if (selectedRegion.type === "state") {
        return norm(d.stateName) === norm(selectedRegion.name);
      }
      return norm(d.countryName) === norm(selectedRegion.name);
    });
  }, [selectedRegion, cityDots]);

  const regionArtists = useMemo(() => {
    if (!selectedRegion || !allArtists) return [];
    const regionName = norm(selectedRegion.name);
    return allArtists.filter(artist => {
      const locations = artist.locations?.length
        ? artist.locations
        : [
            {
              city_name: artist.city_name,
              state_name: artist.state_name,
              country_name: artist.country_name,
            },
          ];
      return locations.some(loc => {
        if (selectedRegion.type === "state") {
          return norm(loc.state_name) === regionName;
        }
        return norm(loc.country_name) === regionName;
      });
    });
  }, [selectedRegion, allArtists]);

  const regionShops = useMemo(() => {
    if (!selectedRegion || !allArtists) return [];
    const regionName = norm(selectedRegion.name);
    const shopMap = new Map<
      number,
      { id: number; shop_name: string; slug?: string | null }
    >();
    allArtists.forEach(artist => {
      const locations = artist.locations?.length ? artist.locations : [];
      locations.forEach(loc => {
        if (!loc.shop_id || !loc.shop_name) return;
        const matches =
          selectedRegion.type === "state"
            ? norm(loc.state_name) === regionName
            : norm(loc.country_name) === regionName;
        if (matches) {
          shopMap.set(loc.shop_id, {
            id: loc.shop_id,
            shop_name: loc.shop_name,
            slug: loc.shop_slug,
          });
        }
      });
    });
    return Array.from(shopMap.values());
  }, [selectedRegion, allArtists]);

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
        setSelectedRegion(null);
        ensureArtistsLoaded();
      }
    },
    [selectedCity, ensureArtistsLoaded]
  );

  const handleStateClick = useCallback(
    (stateName: string) => {
      // Find dots in this state
      const stateDots = cityDots.filter(
        d => norm(d.stateName) === norm(stateName)
      );
      if (stateDots.length === 0) return;

      // Calculate bounding box center and zoom
      const lats = stateDots.map(d => d.lat);
      const lngs = stateDots.map(d => d.lng);
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
      setSelectedRegion({ name: stateName, type: "state" });
      setFlyTo({ coordinates: [centerLng, centerLat], zoom });
      setFlyToKey(k => k + 1);
      ensureArtistsLoaded();
    },
    [cityDots, ensureArtistsLoaded]
  );

  // Zoom to a city from the region panel (stays on region view)
  const handleRegionCityClick = useCallback((city: CityDot) => {
    setFlyTo({
      coordinates: [city.lng, city.lat],
      zoom: Math.max(6, 8),
    });
    setFlyToKey(k => k + 1);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedCity(null);
    setSelectedRegion(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCity(null);
    setSelectedRegion(null);
  }, []);

  // Helper: find a city dot for an artist by matching their city/state
  const findDotForArtist = useCallback(
    (artist: Artist): CityDot | undefined => {
      const locations = artist.locations?.length
        ? artist.locations
        : [
            {
              city_name: artist.city_name,
              state_name: artist.state_name,
            },
          ];
      for (const loc of locations) {
        const match = cityDots.find(
          d =>
            norm(d.cityName) === norm(loc.city_name) &&
            norm(d.stateName) === norm(loc.state_name)
        );
        if (match) return match;
      }
      return undefined;
    },
    [cityDots]
  );

  // Fly to a dot and open its panel
  const flyToDot = useCallback(
    (dot: CityDot) => {
      setSelectedCity(dot);
      setSelectedRegion(null);
      setFlyTo({ coordinates: [dot.lng, dot.lat], zoom: 6 });
      setFlyToKey(k => k + 1);
      ensureArtistsLoaded();
    },
    [ensureArtistsLoaded]
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

  // Process an artist/shop suggestion against loaded artist data
  const processSuggestion = useCallback(
    (suggestion: Suggestion, artists: Artist[]) => {
      if (suggestion.type === "artist" && suggestion.id) {
        const artist = artists.find(a => a.id === suggestion.id);
        if (artist) {
          const dot = findDotForArtist(artist);
          if (dot) {
            flyToDot(dot);
            return true;
          }
        }
      }

      if (suggestion.type === "shop") {
        const artist = artists.find(a => {
          if (a.shop_name === suggestion.label) return true;
          return a.locations?.some(
            l => l.shop_name === suggestion.label
          );
        });
        if (artist) {
          const dot = findDotForArtist(artist);
          if (dot) {
            flyToDot(dot);
            return true;
          }
        }
      }
      return false;
    },
    [findDotForArtist, flyToDot]
  );

  // When allArtists finishes loading, process any pending suggestion
  useEffect(() => {
    if (allArtists && pendingSuggestionRef.current) {
      const pending = pendingSuggestionRef.current;
      pendingSuggestionRef.current = null;
      processSuggestion(pending, allArtists);
    }
  }, [allArtists, processSuggestion]);

  const handleMapSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (suggestion.type === "artist" || suggestion.type === "shop") {
        if (allArtists) {
          if (processSuggestion(suggestion, allArtists)) return;
        } else {
          // Data not loaded yet — store and trigger load
          pendingSuggestionRef.current = suggestion;
          ensureArtistsLoaded();
          return;
        }
      }

      // Location suggestions — use URL param flow
      navigate(`/map?q=${encodeURIComponent(suggestion.label)}`, {
        replace: true,
      });
    },
    [navigate, allArtists, processSuggestion, ensureArtistsLoaded]
  );

  // Build subtitle for the panel
  const citySubtitle = selectedCity
    ? formatArtistLocation({
        state_name: selectedCity.stateName,
        country_name: selectedCity.countryName,
      })
    : "";

  const regionSubtitle = selectedRegion
    ? selectedRegion.type === "state"
      ? "United States"
      : ""
    : "";

  // Whether any panel is showing
  const hasPanel = !!(selectedCity || selectedRegion);

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
            suggestions={suggestions}
            onSelectSuggestion={handleMapSelectSuggestion}
            placeholder="Search artist, shop, or city..."
          />
        </div>
      </div>
      <MapView
        cityData={cityDots}
        onCountrySelect={setSelectedCountry}
        onCityClick={handleCityClick}
        onStateClick={handleStateClick}
        selectedCity={selectedCity}
        flyTo={flyTo}
        flyToKey={flyToKey}
        onBackgroundClick={handleBackgroundClick}
      />

      {!hasPanel && (
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

      {/* Desktop side panel */}
      {hasPanel && !isMobile && (
        <div className={styles.sidePanel}>
          {selectedCity ? (
            <MapDetailPanel
              title={selectedCity.cityName}
              subtitle={citySubtitle}
              variant="city"
              artists={cityArtists}
              shops={cityShops}
              loading={loadingArtists}
              onClose={handleClosePanel}
            />
          ) : selectedRegion ? (
            <MapDetailPanel
              title={selectedRegion.name}
              subtitle={regionSubtitle}
              variant="region"
              artists={regionArtists}
              shops={regionShops}
              cityDots={regionCityDots}
              loading={loadingArtists}
              onClose={handleClosePanel}
              onCityClick={handleRegionCityClick}
            />
          ) : null}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {hasPanel && isMobile && (
        <div className={styles.mobileSheet}>
          {selectedCity ? (
            <MapDetailPanel
              title={selectedCity.cityName}
              subtitle={citySubtitle}
              variant="city"
              artists={cityArtists}
              shops={cityShops}
              loading={loadingArtists}
              onClose={handleClosePanel}
            />
          ) : selectedRegion ? (
            <MapDetailPanel
              title={selectedRegion.name}
              subtitle={regionSubtitle}
              variant="region"
              artists={regionArtists}
              shops={regionShops}
              cityDots={regionCityDots}
              loading={loadingArtists}
              onClose={handleClosePanel}
              onCityClick={handleRegionCityClick}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
