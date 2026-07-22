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
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const US_STATES_GEO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// 4-tier zoom thresholds (MapLibre zoom levels 0-22)
const ZOOM_CONTINENT = 2.5;
const ZOOM_COUNTRY = 4.5;
const ZOOM_CITY = 6.5;

// Minimum cities for a non-US country to get state-level clustering
const STATE_CLUSTER_MIN_CITIES = 5;

// Panel-aware padding for map zoom/fit operations
const PANEL_WIDTH = 400; // 340px panel + gap + breathing room

function getMapPadding() {
  const isDesktop = window.innerWidth > 767;
  return isDesktop
    ? { top: 80, bottom: 50, left: PANEL_WIDTH, right: 50 }
    : { top: 50, bottom: 50, left: 50, right: 50 };
}

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

// Geographic centers for US states (approximate USGS/Census values)
const US_STATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  Alabama: { lat: 32.8, lng: -86.8 },
  Alaska: { lat: 64, lng: -153 },
  Arizona: { lat: 34.3, lng: -111.7 },
  Arkansas: { lat: 34.8, lng: -92.2 },
  California: { lat: 37.2, lng: -119.5 },
  Colorado: { lat: 39, lng: -105.5 },
  Connecticut: { lat: 41.6, lng: -72.7 },
  Delaware: { lat: 39, lng: -75.5 },
  Florida: { lat: 28.6, lng: -82.4 },
  Georgia: { lat: 32.7, lng: -83.5 },
  Hawaii: { lat: 20.8, lng: -156.3 },
  Idaho: { lat: 44.4, lng: -114.6 },
  Illinois: { lat: 40, lng: -89.2 },
  Indiana: { lat: 39.9, lng: -86.3 },
  Iowa: { lat: 42, lng: -93.5 },
  Kansas: { lat: 38.5, lng: -98.4 },
  Kentucky: { lat: 37.8, lng: -85.7 },
  Louisiana: { lat: 31, lng: -92 },
  Maine: { lat: 45.4, lng: -69.2 },
  Maryland: { lat: 39.0, lng: -76.8 },
  Massachusetts: { lat: 42.2, lng: -71.8 },
  Michigan: { lat: 44.3, lng: -84.6 },
  Minnesota: { lat: 46.3, lng: -94.3 },
  Mississippi: { lat: 32.7, lng: -89.7 },
  Missouri: { lat: 38.4, lng: -92.5 },
  Montana: { lat: 47, lng: -109.6 },
  Nebraska: { lat: 41.5, lng: -99.8 },
  Nevada: { lat: 39.5, lng: -116.9 },
  "New Hampshire": { lat: 43.7, lng: -71.6 },
  "New Jersey": { lat: 40.1, lng: -74.7 },
  "New Mexico": { lat: 34.4, lng: -106 },
  "New York": { lat: 42.9, lng: -75.5 },
  "North Carolina": { lat: 35.5, lng: -79.8 },
  "North Dakota": { lat: 47.4, lng: -100.5 },
  Ohio: { lat: 40.4, lng: -82.8 },
  Oklahoma: { lat: 35.6, lng: -97.5 },
  Oregon: { lat: 44, lng: -120.5 },
  Pennsylvania: { lat: 40.9, lng: -77.8 },
  "Rhode Island": { lat: 41.7, lng: -71.5 },
  "South Carolina": { lat: 34, lng: -81 },
  "South Dakota": { lat: 44.4, lng: -100.2 },
  Tennessee: { lat: 35.8, lng: -86.4 },
  Texas: { lat: 31.5, lng: -99.3 },
  Utah: { lat: 39.3, lng: -111.7 },
  Vermont: { lat: 44, lng: -72.7 },
  Virginia: { lat: 37.5, lng: -78.8 },
  Washington: { lat: 47.4, lng: -120.5 },
  "West Virginia": { lat: 38.6, lng: -80.6 },
  Wisconsin: { lat: 44.6, lng: -89.8 },
  Wyoming: { lat: 43, lng: -107.6 },
  "District of Columbia": { lat: 38.9, lng: -77 },
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
  highlightedCity?: CityDot | null;
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

const TIER_ORDER = { continent: 0, country: 1, state: 2, city: 3 } as const;

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
  selected,
  isMobile,
  onDotClick,
  onMouseEnter,
  onMouseLeave,
}: {
  city: CityDot;
  selected: boolean;
  isMobile: boolean;
  onDotClick: (city: CityDot, e: React.MouseEvent) => void;
  onMouseEnter?: (city: CityDot, e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}) {
  const screenPx = getClusterSize(city.artistCount, isMobile);
  const halfPx = screenPx / 2;
  const fontSize = isMobile ? 11 : 10;

  return (
    <Marker
      longitude={city.lng}
      latitude={city.lat}
      anchor="top"
      offset={[0, -halfPx]}
    >
      <div
        className={styles.cityMarker}
        onClick={e => {
          e.stopPropagation();
          onDotClick(city, e);
        }}
        onMouseEnter={
          isMobile || selected ? undefined : e => onMouseEnter?.(city, e)
        }
        onMouseLeave={isMobile || selected ? undefined : onMouseLeave}
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
          {selected && (
            <div
              className={styles.pulseRing}
              style={{
                width: screenPx + 6,
                height: screenPx + 6,
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
              cx={halfPx}
              cy={halfPx}
              r={halfPx}
              fill={
                selected
                  ? "var(--color-primary-hover)"
                  : "var(--color-primary)"
              }
              fillOpacity={selected ? 1 : 0.85}
              stroke="var(--color-surface)"
              strokeWidth={1.5}
            />
            <text
              x={halfPx}
              y={halfPx}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-surface)"
              fontSize={fontSize}
              fontWeight={700}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {city.artistCount}
            </text>
          </svg>
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
  highlightedCity,
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

  // Minimum tier override — when set, tier won't drop below this level
  // Used when fitBounds zooms to a level below the desired tier (e.g. country click)
  const minTierRef = useRef<"continent" | "country" | "state" | "city" | null>(
    null
  );

  // Sync tier from zoom
  const syncTier = useCallback((z: number) => {
    zoomRef.current = z;
    let newTier = getTier(z);
    // Enforce minimum tier if set (e.g. after country click → fitBounds)
    if (
      minTierRef.current &&
      TIER_ORDER[newTier] < TIER_ORDER[minTierRef.current]
    ) {
      console.log(`[syncTier] Enforcing minTier: ${minTierRef.current}, zoom=${z.toFixed(2)}, natural=${newTier}`);
      newTier = minTierRef.current;
    }
    if (newTier !== tierRef.current) {
      console.log(`[syncTier] Tier change: ${tierRef.current} → ${newTier}, zoom=${z.toFixed(2)}`);
      tierRef.current = newTier;
      setTier(newTier);
    }
    setZoom(z);
  }, []);

  // Handle map zoom changes
  const handleZoom = useCallback(
    (e: ViewStateChangeEvent) => {
      // Clear minimum tier override when user zooms out to continent level
      if (minTierRef.current && e.viewState.zoom < ZOOM_CONTINENT) {
        minTierRef.current = null;
      }
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
        padding: getMapPadding(),
      });
      syncTier(mlZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToKey]);

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

  // Zoom to fit a US state using its GeoJSON bounding box
  const flyToStateBounds = useCallback(
    (stateName: string) => {
      if (!usStatesGeoJSON || !mapRef.current) return;

      const feat = usStatesGeoJSON.features.find(
        f => f.properties?.name === stateName
      );
      if (!feat) return;

      // Walk all coordinates to find bounding box
      let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;

      const walkCoords = (coords: unknown) => {
        if (
          Array.isArray(coords) &&
          coords.length >= 2 &&
          typeof coords[0] === "number"
        ) {
          const [lng, lat] = coords as [number, number];
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        } else if (Array.isArray(coords)) {
          for (const c of coords) walkCoords(c);
        }
      };

      walkCoords((feat.geometry as { coordinates: unknown }).coordinates);

      if (!isFinite(minLng)) return;

      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: getMapPadding(), duration: 1000 }
      );

      // Estimate resulting zoom to sync tier
      const lngSpan = maxLng - minLng;
      const latSpan = maxLat - minLat;
      const span = Math.max(lngSpan, latSpan, 0.5);
      const estimatedZoom = Math.log2(360 / span) + 0.5;
      syncTier(Math.max(estimatedZoom, ZOOM_CITY));
    },
    [usStatesGeoJSON, syncTier]
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

  // Tier 2: Country clusters (US splits into state-level clusters)
  const countryClusters = useMemo(() => {
    const map = new Map<
      string,
      { dots: CityDot[]; artists: number; shops: number; isUSState: boolean }
    >();
    cityData.forEach(d => {
      const country = d.countryName || "Unknown";
      let key: string;
      let isUSState = false;
      if (country === "United States" && d.stateName) {
        key = d.stateName;
        isUSState = true;
      } else {
        key = country;
      }
      if (!map.has(key)) {
        map.set(key, { dots: [], artists: 0, shops: 0, isUSState });
      }
      const entry = map.get(key)!;
      entry.dots.push(d);
      entry.artists += d.artistCount;
      entry.shops += d.shopCount;
    });

    const clusters: Cluster[] = [];
    map.forEach((v, name) => {
      const center = v.isUSState
        ? US_STATE_CENTERS[name] || weightedCentroid(v.dots)
        : COUNTRY_CENTERS[name] || weightedCentroid(v.dots);
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
      const isUSState = v.dots.some(
        d => d.countryName === "United States" && d.stateName === name
      );
      const center = isUSState
        ? US_STATE_CENTERS[name] || weightedCentroid(v.dots)
        : weightedCentroid(v.dots);
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
    minTierRef.current = null;
    mapRef.current?.flyTo({
      center: [0, 30],
      zoom: 1.5,
      duration: 800,
    });
    syncTier(1.5);
    setSelectedStateName(null);
    onCountrySelect?.(null);
  }, [onCountrySelect, syncTier]);

  // Country click handler (from GeoJSON layer)
  const handleCountryClick = useCallback(
    (geoName: string) => {
      const dbName = REVERSE_COUNTRY_MAP[geoName] || geoName;

      if (!mapRef.current) return;

      let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;

      // Prefer fitting the country's actual city dots. Large countries like
      // Canada/Russia include vast empty/remote territory (e.g. Arctic islands
      // up to 83°N) that would otherwise force the fit to zoom way out, past
      // all the artists in the populated band.
      const countryDots = cityData.filter(d => d.countryName === dbName);
      if (countryDots.length > 0) {
        for (const d of countryDots) {
          if (d.lng < minLng) minLng = d.lng;
          if (d.lng > maxLng) maxLng = d.lng;
          if (d.lat < minLat) minLat = d.lat;
          if (d.lat > maxLat) maxLat = d.lat;
        }
      } else if (worldGeoJSON) {
        // Fallback: fit the country polygon's bounding box.
        const feat = worldGeoJSON.features.find(
          f => f.properties?.name === geoName
        );
        if (!feat) return;
        const walkCoords = (coords: unknown) => {
          if (
            Array.isArray(coords) &&
            coords.length >= 2 &&
            typeof coords[0] === "number"
          ) {
            const [lng, lat] = coords as [number, number];
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          } else if (Array.isArray(coords)) {
            for (const c of coords) walkCoords(c);
          }
        };
        walkCoords((feat.geometry as { coordinates: unknown }).coordinates);
      }

      if (!isFinite(minLng)) return;

      // Force city tier minimum so dots render even if fitBounds zoom < ZOOM_CITY
      minTierRef.current = "city";

      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: getMapPadding(), duration: 1000, maxZoom: ZOOM_CITY }
      );

      // Estimate resulting zoom and sync tier (minTierRef ensures "city")
      const lngSpan = maxLng - minLng;
      const latSpan = maxLat - minLat;
      const span = Math.max(lngSpan, latSpan, 0.5);
      const estimatedZoom = Math.log2(360 / span) + 0.5;
      syncTier(Math.max(estimatedZoom, ZOOM_CITY));
      onCountrySelect?.(dbName);
    },
    [worldGeoJSON, cityData, onCountrySelect, syncTier]
  );

  // Handle clicks on the map layers (countries, states)
  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) {
        setSelectedStateName(null);
        onBackgroundClick?.();
        return;
      }

      const feat = e.features[0];
      if (feat.layer?.id === "countries-fill") {
        setSelectedStateName(null);
        const geoName = feat.properties?.name || "";
        handleCountryClick(geoName);
      } else if (feat.layer?.id === "states-fill") {
        const stateName = feat.properties?.name || "";
        if (stateName) {
          setSelectedStateName(stateName);
          flyToStateBounds(stateName);
          onStateClick?.(stateName);
        }
      }
    },
    [handleCountryClick, onStateClick, onBackgroundClick, flyToStateBounds]
  );

  // Hover state for countries and states
  const [hoveredCountryId, setHoveredCountryId] = useState<
    number | null
  >(null);
  const [hoveredStateName, setHoveredStateName] = useState<
    string | null
  >(null);

  // Selected US state (highlighted on the map)
  const [selectedStateName, setSelectedStateName] = useState<
    string | null
  >(null);

  const handleMapMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        // At city tier, ignore country fill hover — only city dots matter
        if (
          feat.layer?.id === "countries-fill" &&
          tierRef.current === "city"
        ) {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "";
          }
          setHoveredCountryId(null);
          return;
        }
        if (
          feat.layer?.id === "countries-fill" ||
          feat.layer?.id === "states-fill"
        ) {
          if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = "pointer";
          }
          if (feat.layer?.id === "states-fill") {
            setHoveredStateName(
              (feat.properties?.name as string) || null
            );
            setHoveredCountryId(null);
          } else {
            setHoveredCountryId(
              feat.id != null ? (feat.id as number) : null
            );
            setHoveredStateName(null);
          }
        }
      } else {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = "";
        }
        setHoveredCountryId(null);
        setHoveredStateName(null);
      }
    },
    []
  );

  const handleMapMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
    setHoveredCountryId(null);
    setHoveredStateName(null);
  }, []);

  const handleDotClick = useCallback(
    (city: CityDot) => {
      const newZoom = Math.max(zoomRef.current, ZOOM_CITY);
      mapRef.current?.flyTo({
        center: [city.lng, city.lat],
        zoom: newZoom,
        duration: 800,
        padding: getMapPadding(),
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
        padding: getMapPadding(),
      });
      syncTier(targetZoom);
    },
    [syncTier]
  );

  // Country cluster click — zoom in on the dot's position
  // US state clusters at this tier zoom directly to city level
  const handleCountryClusterClick = useCallback(
    (cluster: Cluster) => {
      const isUSState = cityData.some(
        d =>
          d.countryName === "United States" &&
          d.stateName === cluster.name
      );

      if (isUSState) {
        setSelectedStateName(cluster.name);
        flyToStateBounds(cluster.name);
        onStateClick?.(cluster.name);
      } else {
        setSelectedStateName(null);
        // Use the country's GeoJSON boundary to fitBounds, same as handleCountryClick
        const geoName = COUNTRY_NAME_MAP[cluster.name] || cluster.name;
        handleCountryClick(geoName);
      }
    },
    [cityData, onStateClick, flyToStateBounds, handleCountryClick]
  );

  // State cluster click — zoom to fit state bounds (US) or fly to centroid
  const handleStateClusterClick = useCallback(
    (cluster: Cluster) => {
      const clusterName = cluster.name;

      const isUSState = cityData.some(
        d =>
          d.countryName === "United States" &&
          d.stateName === clusterName
      );

      if (isUSState) {
        setSelectedStateName(clusterName);
        flyToStateBounds(clusterName);
        onStateClick?.(clusterName);
      } else {
        setSelectedStateName(null);
        const targetZoom = ZOOM_CITY + 0.5;
        mapRef.current?.flyTo({
          center: [cluster.lng, cluster.lat],
          zoom: targetZoom,
          duration: 800,
          padding: getMapPadding(),
        });
        syncTier(targetZoom);
      }
    },
    [cityData, onStateClick, syncTier, flyToStateBounds]
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
      (selectedCity?.cityName === city.cityName &&
        selectedCity?.lat === city.lat &&
        selectedCity?.lng === city.lng) ||
      (highlightedCity?.cityName === city.cityName &&
        highlightedCity?.lat === city.lat &&
        highlightedCity?.lng === city.lng),
    [selectedCity, highlightedCity]
  );

  // Derive which states and countries have entries for visual distinction
  const statesWithEntriesArray = useMemo(() => {
    const names = new Set<string>();
    cityData.forEach(dot => {
      if (dot.stateName) names.add(dot.stateName);
    });
    return Array.from(names);
  }, [cityData]);

  const countriesWithEntriesArray = useMemo(() => {
    const names = new Set<string>();
    cityData.forEach(dot => {
      if (dot.countryName) {
        // Add both DB name and mapped GeoJSON name to cover all variants
        names.add(dot.countryName);
        const geoName = COUNTRY_NAME_MAP[dot.countryName];
        if (geoName) names.add(geoName);
      }
    });
    return Array.from(names);
  }, [cityData]);

  // Country fill paint with hover + has-entries distinction
  const countryFillPaint = useMemo(
    () => ({
      "fill-color": [
        "case",
        ["==", ["id"], hoveredCountryId ?? -1],
        "hsl(0, 0%, 72%)",
        ["in", ["get", "name"], ["literal", countriesWithEntriesArray]],
        "hsl(0, 0%, 82%)",
        "hsl(0, 0%, 90%)",
      ] as unknown as string,
      "fill-opacity": 1,
    }),
    [hoveredCountryId, countriesWithEntriesArray]
  );

  // State fill paint with hover + selected + has-entries distinction
  const statesFillPaint = useMemo(
    () => ({
      "fill-color": [
        "case",
        ["==", ["get", "name"], selectedStateName ?? ""],
        "hsl(0, 0%, 72%)",
        ["==", ["get", "name"], hoveredStateName ?? ""],
        "hsl(0, 0%, 72%)",
        ["in", ["get", "name"], ["literal", statesWithEntriesArray]],
        "hsl(0, 0%, 82%)",
        "hsl(0, 0%, 90%)",
      ] as unknown as string,
      "fill-opacity": 1,
    }),
    [selectedStateName, hoveredStateName, statesWithEntriesArray]
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
        interactiveLayerIds={
          tier === "city"
            ? ["states-fill"]
            : ["countries-fill", "states-fill"]
        }
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
              filter={["!=", ["get", "name"], "United States of America"]}
            />
            <Layer
              id="countries-line"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 0.5,
              }}
              filter={["!=", ["get", "name"], "United States of America"]}
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
              paint={statesFillPaint}
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
            const selected = isSelected(city);
            return (
              <CityMarker
                key={`${city.cityName}-${city.lat}-${city.lng}-${i}`}
                city={city}
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
