import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  memo,
} from "react";
import MapGL, {
  Marker,
  Source,
  Layer,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import type { MapLayerMouseEvent, ViewStateChangeEvent } from "react-map-gl";
import useIsMobile from "../../hooks/useIsMobile";
import styles from "./MapView.module.css";

const WORLD_GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_STATES_GEO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// 4-tier zoom thresholds (MapLibre zoom levels 0-22)
const ZOOM_CONTINENT = 2.5;
const ZOOM_COUNTRY = 4.5;
const ZOOM_CITY = 6.5;

// Minimum cities for a non-US country to get state-level clustering
const STATE_CLUSTER_MIN_CITIES = 5;

export interface CityDot {
  cityName: string;
  stateName: string | null;
  countryName: string | null;
  continent: string | null;
  lat: number;
  lng: number;
  artistCount: number;
  shopCount: number;
}

interface Cluster {
  name: string;
  lat: number;
  lng: number;
  totalArtists: number;
  totalShops: number;
  cityCount: number;
}

// Fallback continent lookup for cities missing DB continent data
const CONTINENT_FALLBACK: Record<string, string> = {
  "United States": "North America",
  Canada: "North America",
  Mexico: "North America",
  "Costa Rica": "North America",
  Guatemala: "North America",
  Colombia: "South America",
  Brazil: "South America",
  Argentina: "South America",
  "United Kingdom": "Europe",
  Germany: "Europe",
  France: "Europe",
  Spain: "Europe",
  Italy: "Europe",
  Netherlands: "Europe",
  Belgium: "Europe",
  Portugal: "Europe",
  Ireland: "Europe",
  Sweden: "Europe",
  Norway: "Europe",
  Denmark: "Europe",
  Switzerland: "Europe",
  Austria: "Europe",
  Poland: "Europe",
  "Czech Republic": "Europe",
  Greece: "Europe",
  Finland: "Europe",
  Russia: "Europe",
  "Bosnia and Herzegovina": "Europe",
  Japan: "Asia",
  "South Korea": "Asia",
  Thailand: "Asia",
  China: "Asia",
  Taiwan: "Asia",
  Philippines: "Asia",
  Indonesia: "Asia",
  Singapore: "Asia",
  Vietnam: "Asia",
  India: "Asia",
  Australia: "Oceania",
  "New Zealand": "Oceania",
  "South Africa": "Africa",
};

// Fixed center coordinates for continent clusters (lng, lat)
const CONTINENT_CENTERS: Record<string, { lat: number; lng: number }> = {
  "North America": { lat: 40, lng: -100 },
  "South America": { lat: -15, lng: -55 },
  Europe: { lat: 50, lng: 15 },
  Asia: { lat: 35, lng: 100 },
  Oceania: { lat: -28, lng: 140 },
  Africa: { lat: 5, lng: 20 },
};

// Fixed center overrides for countries where artist data skews the centroid
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number }> = {
  // Americas
  Canada: { lat: 56, lng: -96 },
  "United States": { lat: 39, lng: -98 },
  Mexico: { lat: 23, lng: -102 },
  Brazil: { lat: -14, lng: -51 },
  Colombia: { lat: 4, lng: -72 },
  Argentina: { lat: -34, lng: -64 },
  // Europe
  "United Kingdom": { lat: 54, lng: -2 },
  Ireland: { lat: 53.5, lng: -8 },
  France: { lat: 46.5, lng: 2.5 },
  Spain: { lat: 40, lng: -3.5 },
  Portugal: { lat: 39.5, lng: -8 },
  Germany: { lat: 51, lng: 10 },
  Italy: { lat: 42.5, lng: 12.5 },
  Netherlands: { lat: 52.2, lng: 5.3 },
  Belgium: { lat: 50.5, lng: 4.5 },
  Austria: { lat: 47.5, lng: 14 },
  Switzerland: { lat: 47, lng: 8 },
  Poland: { lat: 52, lng: 19.5 },
  "Czech Republic": { lat: 49.8, lng: 15.5 },
  Sweden: { lat: 62, lng: 15 },
  Norway: { lat: 64, lng: 12 },
  Denmark: { lat: 56, lng: 10 },
  Finland: { lat: 64, lng: 26 },
  Greece: { lat: 39, lng: 22 },
  Croatia: { lat: 45, lng: 16 },
  "Bosnia and Herzegovina": { lat: 44, lng: 17.8 },
  Estonia: { lat: 59, lng: 25 },
  Ukraine: { lat: 49, lng: 31 },
  Iceland: { lat: 65, lng: -19 },
  // Asia & Oceania
  Russia: { lat: 62, lng: 95 },
  China: { lat: 35, lng: 105 },
  Japan: { lat: 36, lng: 138 },
  "South Korea": { lat: 36, lng: 128 },
  Thailand: { lat: 15, lng: 101 },
  Australia: { lat: -25, lng: 134 },
  "New Zealand": { lat: -41, lng: 174 },
};

// Merge "Central America" into "North America" to avoid a lonely cluster
function getContinentForDot(d: CityDot): string {
  const raw =
    d.continent ||
    CONTINENT_FALLBACK[d.countryName || ""] ||
    "Other";
  return raw === "Central America" ? "North America" : raw;
}

// Map country names from our DB to Natural Earth GeoJSON names
const COUNTRY_NAME_MAP: Record<string, string> = {
  "United States": "United States of America",
  USA: "United States of America",
  UK: "United Kingdom",
  "South Korea": "Korea",
};

// Reverse map: GeoJSON name -> DB name
const REVERSE_COUNTRY_MAP: Record<string, string> = {};
Object.entries(COUNTRY_NAME_MAP).forEach(([db, geo]) => {
  REVERSE_COUNTRY_MAP[geo] = db;
});

// Minimal map style with just a background color — we add our own GeoJSON layers
const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#ffffff" },
    },
  ],
};

interface MapViewProps {
  cityData: CityDot[];
  loading?: boolean;
  onCountrySelect?: (countryName: string | null) => void;
  onCityClick?: (city: CityDot) => void;
  onStateClick?: (stateName: string) => void;
  selectedCity?: CityDot | null;
  flyTo?: { coordinates: [number, number]; zoom: number } | null;
  flyToKey?: number;
  onBackgroundClick?: () => void;
}

// Placeholder dots shown while data is loading
const LOADING_CONTINENTS = Object.entries(CONTINENT_CENTERS).map(
  ([name, coords]) => ({
    name,
    lat: coords.lat,
    lng: coords.lng,
  })
);

function getTier(
  z: number
): "continent" | "country" | "state" | "city" {
  if (z < ZOOM_CONTINENT) return "continent";
  if (z < ZOOM_COUNTRY) return "country";
  if (z < ZOOM_CITY) return "state";
  return "city";
}

// Screen-space dot radius in pixels based on artist count
function getDotRadius(
  count: number,
  maxCount: number,
  isMobile: boolean
): number {
  const minPx = isMobile ? 6 : 4;
  const maxPx = isMobile ? 18 : 14;
  const t = maxCount <= 1 ? 0 : Math.sqrt(count) / Math.sqrt(maxCount);
  return minPx + t * (maxPx - minPx);
}

// Cluster marker sizing (screen pixels)
function getClusterSize(
  totalArtists: number,
  isMobile: boolean
): number {
  const minPx = isMobile ? 18 : 16;
  const maxPx = isMobile ? 40 : 36;
  const t = Math.min(1, Math.log10(totalArtists + 1) / 3);
  return minPx + t * (maxPx - minPx);
}

// Memoized loading placeholder marker
const LoadingMarker = memo(function LoadingMarker({
  continent,
  isMobile,
}: {
  continent: { name: string; lat: number; lng: number };
  isMobile: boolean;
}) {
  const size = isMobile ? 52 : 44;

  return (
    <Marker
      longitude={continent.lng}
      latitude={continent.lat}
      anchor="center"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <circle
          className={styles.loadingDot}
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="var(--color-primary)"
          fillOpacity={0.5}
          stroke="var(--color-surface)"
          strokeWidth={1.5}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-surface)"
          fontSize={isMobile ? 9 : 8}
          fontWeight={600}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          ...
        </text>
      </svg>
    </Marker>
  );
});

// Memoized city marker
const CityMarker = memo(function CityMarker({
  city,
  r,
  selected,
  isMobile,
  onDotClick,
  onMouseEnter,
  onMouseLeave,
}: {
  city: CityDot;
  r: number;
  selected: boolean;
  isMobile: boolean;
  onDotClick: (city: CityDot, e: React.MouseEvent) => void;
  onMouseEnter?: (city: CityDot, e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}) {
  const dotSize = r * 2;
  const tapSize = isMobile ? Math.max(40, dotSize + 16) : 0;

  return (
    <Marker
      longitude={city.lng}
      latitude={city.lat}
      anchor="top"
      offset={[0, -r]}
    >
      <div
        className={styles.cityMarker}
        onClick={e => {
          e.stopPropagation();
          onDotClick(city, e);
        }}
        onMouseEnter={
          isMobile ? undefined : e => onMouseEnter?.(city, e)
        }
        onMouseLeave={isMobile ? undefined : onMouseLeave}
      >
        <div
          className={styles.cityDotWrapper}
          style={{ width: dotSize, height: dotSize }}
        >
          {isMobile && tapSize > dotSize && (
            <div
              className={styles.tapTarget}
              style={{ width: tapSize, height: tapSize }}
            />
          )}
          {selected && (
            <div
              className={styles.pulseRing}
              style={{
                width: dotSize + 6,
                height: dotSize + 6,
              }}
            />
          )}
          <div
            className={styles.cityDot}
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: selected
                ? "var(--color-primary-hover)"
                : "var(--color-primary)",
              opacity: selected ? 1 : 0.8,
            }}
          />
        </div>
        <span className={styles.cityLabel}>{city.cityName}</span>
      </div>
    </Marker>
  );
});

// Memoized cluster marker (used for continent, country, and state tiers)
const ClusterMarker = memo(function ClusterMarker({
  cluster,
  label,
  isMobile,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  cluster: Cluster;
  label?: string;
  isMobile: boolean;
  onClick: (cluster: Cluster, e: React.MouseEvent) => void;
  onMouseEnter?: (cluster: Cluster, e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}) {
  const screenPx = getClusterSize(cluster.totalArtists, isMobile);
  const fontSize = isMobile ? 11 : 10;
  const r = screenPx / 2;

  return (
    <Marker
      longitude={cluster.lng}
      latitude={cluster.lat}
      anchor="top"
      offset={[0, -r]}
    >
      <div
        className={styles.cityMarker}
        onClick={e => {
          e.stopPropagation();
          onClick(cluster, e);
        }}
        onMouseEnter={
          isMobile
            ? undefined
            : e => onMouseEnter?.(cluster, e)
        }
        onMouseLeave={isMobile ? undefined : onMouseLeave}
      >
        <div
          className={styles.cityDotWrapper}
          style={{ width: screenPx, height: screenPx }}
        >
          {isMobile && (
            <div
              className={styles.tapTarget}
              style={{
                width: Math.max(40, screenPx),
                height: Math.max(40, screenPx),
              }}
            />
          )}
          <svg
            width={screenPx}
            height={screenPx}
            viewBox={`0 0 ${screenPx} ${screenPx}`}
            style={{ overflow: "visible" }}
          >
            <circle
              cx={r}
              cy={r}
              r={r}
              fill="var(--color-primary)"
              fillOpacity={0.85}
              stroke="var(--color-surface)"
              strokeWidth={1.5}
            />
            <text
              x={r}
              y={r}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-surface)"
              fontSize={fontSize}
              fontWeight={700}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {cluster.totalArtists}
            </text>
          </svg>
        </div>
        {label && (
          <span className={styles.cityLabel}>{label}</span>
        )}
      </div>
    </Marker>
  );
});

// Fix antimeridian artifacts: normalize each polygon ring so consecutive
// points never jump more than 180° in longitude. This may produce coords
// outside [-180,180] (e.g. Russia at ~190°), which MapLibre handles fine.
function normalizeRing(ring: number[][]): number[][] {
  if (ring.length === 0) return ring;
  const result: number[][] = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    let lng = ring[i][0];
    const prevLng = result[i - 1][0];
    while (lng - prevLng > 180) lng -= 360;
    while (prevLng - lng > 180) lng += 360;
    result.push([lng, ring[i][1]]);
  }
  return result;
}

function fixAntimeridian(
  fc: FeatureCollection<Geometry>
): FeatureCollection<Geometry> {
  return {
    ...fc,
    features: fc.features.map(f => {
      const g = f.geometry;
      if (g.type === "Polygon") {
        return {
          ...f,
          geometry: {
            ...g,
            coordinates: g.coordinates.map(normalizeRing),
          },
        };
      }
      if (g.type === "MultiPolygon") {
        return {
          ...f,
          geometry: {
            ...g,
            coordinates: g.coordinates.map(poly =>
              poly.map(normalizeRing)
            ),
          },
        };
      }
      return f;
    }),
  };
}

// Custom hook to fetch and convert TopoJSON to GeoJSON
function useGeoJSON(url: string, objectKey: string) {
  const [data, setData] = useState<FeatureCollection<Geometry> | null>(
    null
  );
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(res => res.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const fc = feature(
          topo,
          topo.objects[objectKey]
        ) as FeatureCollection<Geometry>;
        setData(fixAntimeridian(fc));
      })
      .catch(err => console.error("Failed to load GeoJSON:", err));
    return () => {
      cancelled = true;
    };
  }, [url, objectKey]);
  return data;
}

// Inner component with map logic
function MapInner({
  cityData,
  loading,
  onCountrySelect,
  onCityClick,
  onStateClick,
  selectedCity,
  flyTo,
  flyToKey = 0,
  onBackgroundClick,
}: MapViewProps) {
  const isMobile = useIsMobile();
  const mapRef = useRef<MapRef>(null);

  // Tooltip
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipDataRef = useRef<{
    name: string;
    stateName?: string | null;
    countryName?: string | null;
    artistCount: number;
    shopCount: number;
  } | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    name: string;
    stateName?: string | null;
    countryName?: string | null;
    artistCount: number;
    shopCount: number;
  } | null>(null);

  const [zoom, setZoom] = useState(1.5);
  const zoomRef = useRef(1.5);
  const [tier, setTier] = useState<
    "continent" | "country" | "state" | "city"
  >("continent");
  const tierRef = useRef<"continent" | "country" | "state" | "city">(
    "continent"
  );

  // Load GeoJSON data
  const worldGeoJSON = useGeoJSON(WORLD_GEO_URL, "countries");
  const usStatesGeoJSON = useGeoJSON(US_STATES_GEO_URL, "states");

  // Sync tier from zoom
  const syncTier = useCallback((z: number) => {
    zoomRef.current = z;
    const newTier = getTier(z);
    if (newTier !== tierRef.current) {
      tierRef.current = newTier;
      setTier(newTier);
    }
    setZoom(z);
  }, []);

  // Handle map zoom changes
  const handleZoom = useCallback(
    (e: ViewStateChangeEvent) => {
      syncTier(e.viewState.zoom);
    },
    [syncTier]
  );

  // Fly-to effect
  useEffect(() => {
    if (flyToKey > 0 && flyTo && mapRef.current) {
      // Convert old d3-zoom levels to MapLibre zoom levels
      // Old zoom 6 ≈ MapLibre zoom 6.5, old zoom 1 ≈ MapLibre 1.5
      const mlZoom = flyTo.zoom * 1.1;
      mapRef.current.flyTo({
        center: flyTo.coordinates,
        zoom: mlZoom,
        duration: 1200,
      });
      syncTier(mlZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToKey]);

  const maxCount = useMemo(
    () => Math.max(1, ...cityData.map(d => d.artistCount)),
    [cityData]
  );

  // Helper: compute weighted centroid for a set of city dots
  const weightedCentroid = useCallback(
    (dots: CityDot[]): { lat: number; lng: number } => {
      let wLat = 0,
        wLng = 0,
        wTotal = 0;
      dots.forEach(d => {
        const w = d.artistCount || 1;
        wLat += d.lat * w;
        wLng += d.lng * w;
        wTotal += w;
      });
      return { lat: wLat / wTotal, lng: wLng / wTotal };
    },
    []
  );

  // Tier 1: Continent clusters
  const continentClusters = useMemo(() => {
    const map = new Map<
      string,
      { dots: CityDot[]; artists: number; shops: number }
    >();
    cityData.forEach(d => {
      const continent = getContinentForDot(d);
      if (!map.has(continent)) {
        map.set(continent, { dots: [], artists: 0, shops: 0 });
      }
      const entry = map.get(continent)!;
      entry.dots.push(d);
      entry.artists += d.artistCount;
      entry.shops += d.shopCount;
    });

    const clusters: Cluster[] = [];
    map.forEach((v, continent) => {
      const center =
        CONTINENT_CENTERS[continent] || weightedCentroid(v.dots);
      clusters.push({
        name: continent,
        lat: center.lat,
        lng: center.lng,
        totalArtists: v.artists,
        totalShops: v.shops,
        cityCount: v.dots.length,
      });
    });
    return clusters;
  }, [cityData, weightedCentroid]);

  // Tier 2: Country clusters
  const countryClusters = useMemo(() => {
    const map = new Map<
      string,
      { dots: CityDot[]; artists: number; shops: number }
    >();
    cityData.forEach(d => {
      const country = d.countryName || "Unknown";
      if (!map.has(country)) {
        map.set(country, { dots: [], artists: 0, shops: 0 });
      }
      const entry = map.get(country)!;
      entry.dots.push(d);
      entry.artists += d.artistCount;
      entry.shops += d.shopCount;
    });

    const clusters: Cluster[] = [];
    map.forEach((v, country) => {
      const center =
        COUNTRY_CENTERS[country] || weightedCentroid(v.dots);
      clusters.push({
        name: country,
        lat: center.lat,
        lng: center.lng,
        totalArtists: v.artists,
        totalShops: v.shops,
        cityCount: v.dots.length,
      });
    });
    return clusters;
  }, [cityData, weightedCentroid]);

  // Tier 3: State clusters
  const stateClusters = useMemo(() => {
    const countryCityCounts = new Map<string, number>();
    cityData.forEach(d => {
      const c = d.countryName || "Unknown";
      countryCityCounts.set(c, (countryCityCounts.get(c) || 0) + 1);
    });

    const map = new Map<
      string,
      { dots: CityDot[]; artists: number; shops: number }
    >();
    cityData.forEach(d => {
      const country = d.countryName || "Unknown";
      let key: string;
      if (country === "United States" && d.stateName) {
        key = d.stateName;
      } else if (
        (countryCityCounts.get(country) || 0) >=
          STATE_CLUSTER_MIN_CITIES &&
        d.stateName
      ) {
        key = `${d.stateName}, ${country}`;
      } else {
        key = country;
      }
      if (!map.has(key)) {
        map.set(key, { dots: [], artists: 0, shops: 0 });
      }
      const entry = map.get(key)!;
      entry.dots.push(d);
      entry.artists += d.artistCount;
      entry.shops += d.shopCount;
    });

    const clusters: Cluster[] = [];
    map.forEach((v, name) => {
      const center = weightedCentroid(v.dots);
      clusters.push({
        name,
        lat: center.lat,
        lng: center.lng,
        totalArtists: v.artists,
        totalShops: v.shops,
        cityCount: v.dots.length,
      });
    });
    return clusters;
  }, [cityData, weightedCentroid]);

  // Move tooltip via DOM
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipRef.current && tooltipDataRef.current) {
      tooltipRef.current.style.left = `${e.clientX + 12}px`;
      tooltipRef.current.style.top = `${e.clientY - 12}px`;
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 });
  }, []);

  const handleReset = useCallback(() => {
    mapRef.current?.flyTo({
      center: [0, 30],
      zoom: 1.5,
      duration: 800,
    });
    syncTier(1.5);
    onCountrySelect?.(null);
  }, [onCountrySelect, syncTier]);

  // Country click handler (from GeoJSON layer)
  const handleCountryClick = useCallback(
    (geoName: string) => {
      const dbName = REVERSE_COUNTRY_MAP[geoName] || geoName;
      const countryDots = cityData.filter(d => {
        const dotCountry = d.countryName || "";
        return (
          dotCountry === dbName ||
          dotCountry === geoName ||
          COUNTRY_NAME_MAP[dotCountry] === geoName
        );
      });

      if (countryDots.length === 0) return;

      const lats = countryDots.map(d => d.lat);
      const lngs = countryDots.map(d => d.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const spread = Math.max(latSpread, lngSpread, 1);

      let targetZoom: number;
      if (spread > 30) targetZoom = 3;
      else if (spread > 15) targetZoom = 3.8;
      else if (spread > 8) targetZoom = 4.8;
      else if (spread > 3) targetZoom = 5.5;
      else targetZoom = 6.5;

      targetZoom = Math.max(targetZoom, ZOOM_COUNTRY);

      mapRef.current?.flyTo({
        center: [centerLng, centerLat],
        zoom: targetZoom,
        duration: 1000,
      });
      syncTier(targetZoom);
      onCountrySelect?.(dbName);
    },
    [cityData, onCountrySelect, syncTier]
  );

  // Handle clicks on the map layers (countries, states)
  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) {
        onBackgroundClick?.();
        return;
      }

      const feat = e.features[0];
      if (feat.layer?.id === "countries-fill") {
        const geoName = feat.properties?.name || "";
        handleCountryClick(geoName);
      } else if (feat.layer?.id === "states-fill") {
        const stateName = feat.properties?.name || "";
        if (stateName) onStateClick?.(stateName);
      }
    },
    [handleCountryClick, onStateClick, onBackgroundClick]
  );

  // Hover state for countries
  const [hoveredCountryId, setHoveredCountryId] = useState<
    number | null
  >(null);

  const handleMapMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        if (
          feat.layer?.id === "countries-fill" ||
          feat.layer?.id === "states-fill"
        ) {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "pointer";
          }
          if (feat.id != null) {
            setHoveredCountryId(feat.id as number);
          }
        }
      } else {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = "";
        }
        setHoveredCountryId(null);
      }
    },
    []
  );

  const handleMapMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
    setHoveredCountryId(null);
  }, []);

  const handleDotClick = useCallback(
    (city: CityDot) => {
      const newZoom = Math.max(zoomRef.current, ZOOM_CITY);
      mapRef.current?.flyTo({
        center: [city.lng, city.lat],
        zoom: newZoom,
        duration: 800,
      });
      syncTier(newZoom);
      tooltipDataRef.current = null;
      setTooltipData(null);
      onCityClick?.(city);
    },
    [onCityClick, syncTier]
  );

  const handleMarkerClick = useCallback(
    (city: CityDot) => {
      handleDotClick(city);
    },
    [handleDotClick]
  );

  // Continent cluster click — zoom in on the dot's position
  const handleContinentClusterClick = useCallback(
    (cluster: Cluster) => {
      const targetZoom = ZOOM_CONTINENT + 0.5;

      mapRef.current?.flyTo({
        center: [cluster.lng, cluster.lat],
        zoom: targetZoom,
        duration: 800,
      });
      syncTier(targetZoom);
    },
    [syncTier]
  );

  // Country cluster click — zoom in on the dot's position
  const handleCountryClusterClick = useCallback(
    (cluster: Cluster) => {
      const dbName = cluster.name;
      const targetZoom = ZOOM_COUNTRY + 0.5;

      mapRef.current?.flyTo({
        center: [cluster.lng, cluster.lat],
        zoom: targetZoom,
        duration: 800,
      });
      syncTier(targetZoom);
      onCountrySelect?.(dbName);
    },
    [onCountrySelect, syncTier]
  );

  // State cluster click — zoom in on the dot's position
  const handleStateClusterClick = useCallback(
    (cluster: Cluster) => {
      const clusterName = cluster.name;
      const targetZoom = ZOOM_CITY + 0.5;

      mapRef.current?.flyTo({
        center: [cluster.lng, cluster.lat],
        zoom: targetZoom,
        duration: 800,
      });
      syncTier(targetZoom);

      if (
        cityData.some(
          d =>
            d.countryName === "United States" &&
            d.stateName === clusterName
        )
      ) {
        onStateClick?.(clusterName);
      }
    },
    [cityData, onStateClick, syncTier]
  );

  const handleMarkerEnter = useCallback(
    (city: CityDot, e: React.MouseEvent) => {
      const data = {
        name: city.cityName,
        stateName: city.stateName,
        countryName: city.countryName,
        artistCount: city.artistCount,
        shopCount: city.shopCount,
      };
      tooltipDataRef.current = data;
      setTooltipData(data);
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 12}px`;
        tooltipRef.current.style.top = `${e.clientY - 12}px`;
      }
    },
    []
  );

  const handleClusterEnter = useCallback(
    (cluster: Cluster, e: React.MouseEvent) => {
      const data = {
        name: cluster.name,
        artistCount: cluster.totalArtists,
        shopCount: cluster.totalShops,
      };
      tooltipDataRef.current = data;
      setTooltipData(data);
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 12}px`;
        tooltipRef.current.style.top = `${e.clientY - 12}px`;
      }
    },
    []
  );

  const handleMarkerLeave = useCallback(() => {
    tooltipDataRef.current = null;
    setTooltipData(null);
  }, []);

  const isSelected = useCallback(
    (city: CityDot) =>
      selectedCity?.cityName === city.cityName &&
      selectedCity?.lat === city.lat &&
      selectedCity?.lng === city.lng,
    [selectedCity]
  );

  // Country fill paint with hover
  const countryFillPaint = useMemo(
    () => ({
      "fill-color": [
        "case",
        ["==", ["id"], hoveredCountryId ?? -1],
        "hsl(0, 0%, 78%)",
        "hsl(0, 0%, 87%)",
      ] as unknown as string,
      "fill-opacity": 1,
    }),
    [hoveredCountryId]
  );

  return (
    <div
      className={styles.mapWrapper}
      onMouseMove={handleMouseMove}
    >
      <div
        className={styles.zoomControls}
        onClick={e => e.stopPropagation()}
      >
        <button
          className={styles.zoomButton}
          onClick={handleZoomIn}
          title="Zoom in"
        >
          +
        </button>
        <button
          className={styles.zoomButton}
          onClick={handleZoomOut}
          title="Zoom out"
        >
          −
        </button>
        {zoom > 1.8 && (
          <button
            className={styles.zoomButton}
            onClick={handleReset}
            title="Reset zoom"
          >
            ↺
          </button>
        )}
      </div>

      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: 0,
          latitude: 30,
          zoom: 1.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onZoom={handleZoom}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        interactiveLayerIds={["countries-fill", "states-fill"]}
        scrollZoom={{
          around: "center",
        }}
        maxZoom={18}
        minZoom={1}
        attributionControl={false}
      >
        {/* Country borders */}
        {worldGeoJSON && (
          <Source
            id="countries"
            type="geojson"
            data={worldGeoJSON}
            promoteId="name"
          >
            <Layer
              id="countries-fill"
              type="fill"
              paint={countryFillPaint}
            />
            <Layer
              id="countries-line"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 0.5,
              }}
            />
          </Source>
        )}

        {/* US state borders */}
        {usStatesGeoJSON && (
          <Source
            id="us-states"
            type="geojson"
            data={usStatesGeoJSON}
            promoteId="name"
          >
            <Layer
              id="states-fill"
              type="fill"
              paint={{
                "fill-color": "transparent",
                "fill-opacity": 1,
              }}
            />
            <Layer
              id="states-line"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 0.3,
              }}
            />
          </Source>
        )}

        {/* Tier 1: Continent clusters (or loading placeholders) */}
        {tier === "continent" &&
          (loading || cityData.length === 0) &&
          LOADING_CONTINENTS.map(c => (
            <LoadingMarker
              key={c.name}
              continent={c}
              isMobile={isMobile}
            />
          ))}
        {tier === "continent" &&
          !loading &&
          cityData.length > 0 &&
          continentClusters.map(cluster => (
            <ClusterMarker
              key={cluster.name}
              cluster={cluster}
              label={cluster.name}
              isMobile={isMobile}
              onClick={handleContinentClusterClick}
              onMouseEnter={
                isMobile ? undefined : handleClusterEnter
              }
              onMouseLeave={
                isMobile ? undefined : handleMarkerLeave
              }
            />
          ))}

        {/* Tier 2: Country clusters */}
        {tier === "country" &&
          countryClusters.map(cluster => (
            <ClusterMarker
              key={cluster.name}
              cluster={cluster}
              label={cluster.name}
              isMobile={isMobile}
              onClick={handleCountryClusterClick}
              onMouseEnter={
                isMobile ? undefined : handleClusterEnter
              }
              onMouseLeave={
                isMobile ? undefined : handleMarkerLeave
              }
            />
          ))}

        {/* Tier 3: State clusters */}
        {tier === "state" &&
          stateClusters.map(cluster => (
            <ClusterMarker
              key={cluster.name}
              cluster={cluster}
              label={cluster.name.split(",")[0]}
              isMobile={isMobile}
              onClick={handleStateClusterClick}
              onMouseEnter={
                isMobile ? undefined : handleClusterEnter
              }
              onMouseLeave={
                isMobile ? undefined : handleMarkerLeave
              }
            />
          ))}

        {/* Tier 4: Individual city dots */}
        {tier === "city" &&
          cityData.map((city, i) => {
            const r = getDotRadius(
              city.artistCount,
              maxCount,
              isMobile
            );
            const selected = isSelected(city);
            return (
              <CityMarker
                key={`${city.cityName}-${city.lat}-${city.lng}-${i}`}
                city={city}
                r={r}
                selected={selected}
                isMobile={isMobile}
                onDotClick={handleMarkerClick}
                onMouseEnter={
                  isMobile ? undefined : handleMarkerEnter
                }
                onMouseLeave={
                  isMobile ? undefined : handleMarkerLeave
                }
              />
            );
          })}
      </MapGL>

      {!isMobile && tooltipData && (
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{ position: "fixed", pointerEvents: "none" }}
        >
          <div className={styles.tooltipCity}>
            {[
              tooltipData.name,
              tooltipData.stateName,
              tooltipData.countryName,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
          <div className={styles.tooltipCount}>
            {tooltipData.artistCount}{" "}
            {tooltipData.artistCount === 1 ? "artist" : "artists"}
            {tooltipData.shopCount ? (
              <>
                {" "}
                &middot; {tooltipData.shopCount}{" "}
                {tooltipData.shopCount === 1 ? "shop" : "shops"}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapView(props: MapViewProps) {
  return <MapInner {...props} />;
}
