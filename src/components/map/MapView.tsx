import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  memo,
} from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import useIsMobile from "../../hooks/useIsMobile";
import styles from "./MapView.module.css";

const WORLD_GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const US_STATES_GEO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// 4-tier zoom thresholds: Continent → Country → State → City
const ZOOM_CONTINENT = 1.8;
const ZOOM_COUNTRY = 3.5;
const ZOOM_CITY = 6;

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
  "Costa Rica": "Central America",
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
  "Central America": { lat: 15, lng: -85 },
  "South America": { lat: -15, lng: -55 },
  Europe: { lat: 50, lng: 15 },
  Asia: { lat: 35, lng: 100 },
  Oceania: { lat: -28, lng: 140 },
  Africa: { lat: 5, lng: 20 },
};

function getContinentForDot(d: CityDot): string {
  return (
    d.continent ||
    CONTINENT_FALLBACK[d.countryName || ""] ||
    "Other"
  );
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

// Stable style objects — never recreated
const COUNTRY_STYLE = {
  default: {
    fill: "var(--gray-200)",
    outline: "none",
  },
  hover: {
    fill: "var(--gray-300)",
    outline: "none",
    cursor: "pointer" as const,
  },
  pressed: {
    fill: "var(--gray-300)",
    outline: "none",
  },
};

const STATE_STYLE = {
  default: {
    fill: "transparent",
    outline: "none",
    cursor: "pointer" as const,
  },
  hover: {
    fill: "rgba(0,0,0,0.06)",
    outline: "none",
    cursor: "pointer" as const,
  },
  pressed: {
    fill: "rgba(0,0,0,0.08)",
    outline: "none",
  },
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

// Memoized loading placeholder marker
const LoadingMarker = memo(function LoadingMarker({
  continent,
  zoom,
  isMobile,
}: {
  continent: { name: string; lat: number; lng: number };
  zoom: number;
  isMobile: boolean;
}) {
  const screenPx = isMobile ? 26 : 22;
  const r = screenPx / zoom;
  const fontSize = Math.max(8, (isMobile ? 9 : 8)) / zoom;
  const strokeW = 1.5 / zoom;

  return (
    <Marker coordinates={[continent.lng, continent.lat]}>
      <circle
        className={styles.loadingDot}
        r={r}
        fill="var(--color-primary)"
        fillOpacity={0.5}
        stroke="var(--color-surface)"
        strokeWidth={strokeW}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-surface)"
        fontSize={fontSize}
        fontWeight={600}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        ...
      </text>
    </Marker>
  );
});

// Desired screen-space radius in pixels based on artist count.
// ZoomableGroup scales SVG by `zoom`, so to get X screen pixels
// we need to set the SVG circle r = X / zoom.
function getDotRadius(
  count: number,
  maxCount: number,
  zoom: number,
  isMobile: boolean
): number {
  const minPx = isMobile ? 6 : 4;
  const maxPx = isMobile ? 18 : 14;
  const t = maxCount <= 1 ? 0 : Math.sqrt(count) / Math.sqrt(maxCount);
  const screenPx = minPx + t * (maxPx - minPx);
  return screenPx / zoom;
}

function filterZoomEvent(event: {
  type: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}) {
  if ("touches" in event) return true;
  if (event.type === "mousemove" || event.type === "mousedown") return true;
  if (event.type === "wheel")
    return !!(event.ctrlKey || event.metaKey || event.altKey);
  return true;
}

// Memoized city marker
const CityMarker = memo(function CityMarker({
  city,
  r,
  tapR,
  selected,
  zoomScale,
  isMobile,
  onDotClick,
  onMouseEnter,
  onMouseLeave,
}: {
  city: CityDot;
  r: number;
  tapR: number;
  selected: boolean;
  zoomScale: number;
  isMobile: boolean;
  onDotClick: (city: CityDot, e: React.MouseEvent) => void;
  onMouseEnter?: (city: CityDot, e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}) {
  return (
    <Marker coordinates={[city.lng, city.lat]}>
      {isMobile && tapR > r && (
        <circle
          r={tapR}
          fill="transparent"
          onClick={e => {
            e.stopPropagation();
            onDotClick(city, e);
          }}
          style={{ cursor: "pointer" }}
        />
      )}
      {selected && (
        <circle
          r={r + 3 / zoomScale}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2 / zoomScale}
          className={styles.pulseRing}
        />
      )}
      <circle
        className={styles.cityDot}
        r={r}
        fill={
          selected
            ? "var(--color-primary-hover)"
            : "var(--color-primary)"
        }
        fillOpacity={selected ? 1 : 0.8}
        stroke="var(--color-surface)"
        strokeWidth={1 / zoomScale}
        onMouseEnter={
          isMobile ? undefined : e => onMouseEnter?.(city, e)
        }
        onClick={e => {
          e.stopPropagation();
          onDotClick(city, e);
        }}
        onMouseLeave={isMobile ? undefined : onMouseLeave}
        style={{ cursor: "pointer" }}
      />
    </Marker>
  );
});

// Memoized cluster marker (used for continent, country, and state tiers)
const ClusterMarker = memo(function ClusterMarker({
  cluster,
  zoom,
  isMobile,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  cluster: Cluster;
  zoom: number;
  isMobile: boolean;
  onClick: (cluster: Cluster, e: React.MouseEvent) => void;
  onMouseEnter?: (cluster: Cluster, e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}) {
  // Screen-space sizing: bigger clusters get bigger dots
  const minPx = isMobile ? 18 : 16;
  const maxPx = isMobile ? 40 : 36;
  // Use log scale for clusters since counts vary wildly (1 vs 500)
  const t = Math.min(1, Math.log10(cluster.totalArtists + 1) / 3);
  const screenPx = minPx + t * (maxPx - minPx);
  const r = screenPx / zoom;
  const fontSize = Math.max(8, (isMobile ? 11 : 10)) / zoom;
  const strokeW = 1.5 / zoom;

  return (
    <Marker coordinates={[cluster.lng, cluster.lat]}>
      {isMobile && (
        <circle
          r={Math.max(20 / zoom, r)}
          fill="transparent"
          onClick={e => {
            e.stopPropagation();
            onClick(cluster, e);
          }}
          style={{ cursor: "pointer" }}
        />
      )}
      <circle
        className={styles.cityDot}
        r={r}
        fill="var(--color-primary)"
        fillOpacity={0.85}
        stroke="var(--color-surface)"
        strokeWidth={strokeW}
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
        style={{ cursor: "pointer" }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-surface)"
        fontSize={fontSize}
        fontWeight={700}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {cluster.totalArtists}
      </text>
    </Marker>
  );
});

export default function MapView({
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

  // Tooltip data stored in ref — position updated via DOM, not React state
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

  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({ coordinates: [0, 30], zoom: 1 });
  const [jumpKey, setJumpKey] = useState(0);

  useEffect(() => {
    if (flyToKey > 0 && flyTo) {
      setPosition({
        coordinates: flyTo.coordinates,
        zoom: flyTo.zoom,
      });
      setJumpKey(k => k + 1);
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
      // Use fixed continent centers for better positioning
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
      const center = weightedCentroid(v.dots);
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

  // Tier 3: State clusters (US grouped by state; non-US small countries show as-is)
  const stateClusters = useMemo(() => {
    // Count cities per country to decide which skip to city-level
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
        (countryCityCounts.get(country) || 0) >= STATE_CLUSTER_MIN_CITIES &&
        d.stateName
      ) {
        // Large non-US countries: group by state/province
        key = `${d.stateName}, ${country}`;
      } else {
        // Small countries: keep as country cluster at this tier
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

  // Move tooltip via DOM — no React re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipRef.current && tooltipDataRef.current) {
      tooltipRef.current.style.left = `${e.clientX + 12}px`;
      tooltipRef.current.style.top = `${e.clientY - 12}px`;
    }
  }, []);

  const maxZoom = 50;
  const handleZoomIn = () =>
    setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, maxZoom) }));
  const handleZoomOut = () =>
    setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleReset = useCallback(() => {
    setPosition({ coordinates: [0, 30], zoom: 1 });
    setJumpKey(k => k + 1);
    onCountrySelect?.(null);
  }, [onCountrySelect]);

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

      let zoom: number;
      if (spread > 30) zoom = 2;
      else if (spread > 15) zoom = 3;
      else if (spread > 8) zoom = 4;
      else if (spread > 3) zoom = 5;
      else zoom = 6;

      // Ensure we zoom past country cluster threshold into state tier
      zoom = Math.max(zoom, ZOOM_COUNTRY);

      setPosition({ coordinates: [centerLng, centerLat], zoom });
      setJumpKey(k => k + 1);
      onCountrySelect?.(dbName);
    },
    [cityData, onCountrySelect]
  );

  const handleDotClick = useCallback(
    (city: CityDot) => {
      setPosition(prev => ({
        coordinates: [city.lng, city.lat],
        zoom: Math.max(prev.zoom, 6),
      }));
      setJumpKey(k => k + 1);
      tooltipDataRef.current = null;
      setTooltipData(null);
      onCityClick?.(city);
    },
    [onCityClick]
  );

  const handleMarkerClick = useCallback(
    (city: CityDot, _e: React.MouseEvent) => {
      handleDotClick(city);
    },
    [handleDotClick]
  );

  // Click handler for continent clusters — zoom to country tier
  const handleContinentClusterClick = useCallback(
    (cluster: Cluster, _e: React.MouseEvent) => {
      const dots = cityData.filter(
        d => getContinentForDot(d) === cluster.name
      );
      if (dots.length === 0) return;

      const lats = dots.map(d => d.lat);
      const lngs = dots.map(d => d.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const spread = Math.max(latSpread, lngSpread, 1);

      let zoom: number;
      if (spread > 60) zoom = 1.8;
      else if (spread > 30) zoom = 2.5;
      else if (spread > 15) zoom = 3;
      else zoom = 3.5;

      // Ensure we land in country tier
      zoom = Math.max(zoom, ZOOM_CONTINENT);

      setPosition({ coordinates: [centerLng, centerLat], zoom });
      setJumpKey(k => k + 1);
    },
    [cityData]
  );

  // Click handler for country clusters — zoom to state tier
  const handleCountryClusterClick = useCallback(
    (cluster: Cluster, _e: React.MouseEvent) => {
      const geoName =
        COUNTRY_NAME_MAP[cluster.name] || cluster.name;
      handleCountryClick(geoName);
    },
    [handleCountryClick]
  );

  // Click handler for state clusters — zoom to city tier
  const handleStateClusterClick = useCallback(
    (cluster: Cluster, _e: React.MouseEvent) => {
      // Find the city dots in this state cluster
      const clusterName = cluster.name;
      const dots = cityData.filter(d => {
        const country = d.countryName || "Unknown";
        if (country === "United States" && d.stateName) {
          return d.stateName === clusterName;
        }
        // For non-US state clusters like "Ontario, Canada"
        if (d.stateName && `${d.stateName}, ${country}` === clusterName) {
          return true;
        }
        // For small countries kept as country clusters
        return country === clusterName;
      });

      if (dots.length === 0) return;

      const lats = dots.map(d => d.lat);
      const lngs = dots.map(d => d.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const spread = Math.max(latSpread, lngSpread, 1);

      let zoom: number;
      if (spread > 8) zoom = 4;
      else if (spread > 3) zoom = 5;
      else zoom = 6;

      // Ensure we land in city tier
      zoom = Math.max(zoom, ZOOM_CITY);

      setPosition({ coordinates: [centerLng, centerLat], zoom });
      setJumpKey(k => k + 1);

      // Open state panel for US states
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
    [cityData, onStateClick]
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

  const zoom = position.zoom;
  const strokeScale = zoom;
  const tier =
    zoom < ZOOM_CONTINENT
      ? "continent"
      : zoom < ZOOM_COUNTRY
        ? "country"
        : zoom < ZOOM_CITY
          ? "state"
          : "city";

  return (
    <div
      className={styles.mapWrapper}
      onMouseMove={handleMouseMove}
      onClick={onBackgroundClick}
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
        {position.zoom > 1 && (
          <button
            className={styles.zoomButton}
            onClick={handleReset}
            title="Reset zoom"
          >
            ↺
          </button>
        )}
      </div>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 130,
          center: [0, 30],
        }}
        width={800}
        height={450}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          key={jumpKey}
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={({ coordinates, zoom: newZoom }) =>
            setPosition({
              coordinates: coordinates as [number, number],
              zoom: newZoom,
            })
          }
          minZoom={1}
          maxZoom={maxZoom}
          filterZoomEvent={filterZoomEvent}
        >
          <Geographies geography={WORLD_GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const geoName = geo.properties.name || "";
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="var(--gray-200)"
                    stroke="var(--color-surface)"
                    strokeWidth={0.5}
                    onClick={e => {
                      e.stopPropagation();
                      handleCountryClick(geoName);
                    }}
                    style={COUNTRY_STYLE}
                  />
                );
              })
            }
          </Geographies>
          <Geographies geography={US_STATES_GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const stateName = geo.properties.name || "";
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="transparent"
                    stroke="var(--color-surface)"
                    strokeWidth={0.3}
                    onClick={e => {
                      e.stopPropagation();
                      if (stateName) onStateClick?.(stateName);
                    }}
                    style={STATE_STYLE}
                  />
                );
              })
            }
          </Geographies>

          {/* Tier 1: Continent clusters (or loading placeholders) */}
          {tier === "continent" &&
            (loading || cityData.length === 0) &&
            LOADING_CONTINENTS.map(c => (
              <LoadingMarker
                key={c.name}
                continent={c}
                zoom={zoom}
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
                zoom={zoom}
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
                zoom={zoom}
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
                zoom={zoom}
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
                zoom,
                isMobile
              );
              const tapR = isMobile ? Math.max(12 / zoom, r) : 0;
              const selected = isSelected(city);
              return (
                <CityMarker
                  key={`${city.cityName}-${city.lat}-${city.lng}-${i}`}
                  city={city}
                  r={r}
                  tapR={tapR}
                  selected={selected}
                  zoomScale={strokeScale}
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
        </ZoomableGroup>
      </ComposableMap>
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
