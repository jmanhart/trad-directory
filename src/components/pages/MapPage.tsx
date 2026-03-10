import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchTattooShopsWithArtists } from "../../services/api";
import type { Artist } from "../../types/entities";
import useIsMobile from "../../hooks/useIsMobile";
import MapView, { CityDot } from "../../components/map/MapView";
import CityDetailCard from "../../components/map/CityDetailCard";
import styles from "./MapPage.module.css";
import mapStyles from "../../components/map/MapView.module.css";

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
  const [cityDots, setCityDots] = useState<CityDot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<CityDot | null>(null);

  // Lazily loaded full artist data for city detail card
  const [allArtists, setAllArtists] = useState<Artist[] | null>(null);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const artistsFetchedRef = useRef(false);

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
      } finally {
        setIsLoading(false);
      }
    }
    load();
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

  return (
    <div className={styles.container}>
      {isLoading ? (
        <p className={mapStyles.loading}>Loading map data...</p>
      ) : (
        <MapView
          cityData={cityDots}
          onCountrySelect={setSelectedCountry}
          onCityClick={handleCityClick}
          selectedCity={selectedCity}
        />
      )}

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
      )}
    </div>
  );
}
