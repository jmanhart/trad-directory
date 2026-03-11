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
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_STATES_GEO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export interface CityDot {
  cityName: string;
  stateName: string | null;
  countryName: string | null;
  lat: number;
  lng: number;
  artistCount: number;
  shopCount: number;
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
  onCountrySelect?: (countryName: string | null) => void;
  onCityClick?: (city: CityDot) => void;
  onStateClick?: (stateName: string) => void;
  selectedCity?: CityDot | null;
  flyTo?: { coordinates: [number, number]; zoom: number } | null;
  flyToKey?: number;
  onBackgroundClick?: () => void;
}

// Desired screen-space radius in pixels based on artist count.
// ZoomableGroup scales SVG by `zoom`, so to get X screen pixels
// we need to set the SVG circle r = X / zoom.
function getDotRadius(
  count: number,
  maxCount: number,
  zoom: number,
  isMobile: boolean
): number {
  // Screen-pixel sizes we want to see
  const minPx = isMobile ? 6 : 4;
  const maxPx = isMobile ? 18 : 14;

  // Proportional size based on artist count
  const t = maxCount <= 1 ? 0 : Math.sqrt(count) / Math.sqrt(maxCount);
  const screenPx = minPx + t * (maxPx - minPx);

  // Convert to SVG units (ZoomableGroup multiplies by zoom)
  return screenPx / zoom;
}

function filterZoomEvent(event: {
  type: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}) {
  // Allow all touch events (pinch-to-zoom)
  if ("touches" in event) return true;
  // Allow mouse drag for panning
  if (event.type === "mousemove" || event.type === "mousedown") return true;
  // Block wheel zoom unless Ctrl, Cmd, or Option is held
  if (event.type === "wheel")
    return !!(event.ctrlKey || event.metaKey || event.altKey);
  return true;
}

// Memoized marker to avoid re-rendering all dots when one changes
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
          isMobile
            ? undefined
            : e => onMouseEnter?.(city, e)
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

export default function MapView({
  cityData,
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
  const tooltipDataRef = useRef<CityDot | null>(null);
  const [tooltipCity, setTooltipCity] = useState<CityDot | null>(null);

  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({ coordinates: [0, 30], zoom: 1 });
  // Counter to force ZoomableGroup remount on programmatic jumps
  const [jumpKey, setJumpKey] = useState(0);

  // Fly to a location when parent triggers it
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
      // Find the DB name for this country
      const dbName = REVERSE_COUNTRY_MAP[geoName] || geoName;

      // Find dots in this country
      const countryDots = cityData.filter(d => {
        const dotCountry = d.countryName || "";
        return (
          dotCountry === dbName ||
          dotCountry === geoName ||
          COUNTRY_NAME_MAP[dotCountry] === geoName
        );
      });

      if (countryDots.length === 0) return;

      // Calculate bounding box center and zoom
      const lats = countryDots.map(d => d.lat);
      const lngs = countryDots.map(d => d.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      // Determine zoom based on spread
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const spread = Math.max(latSpread, lngSpread, 1);

      let zoom: number;
      if (spread > 30) zoom = 2;
      else if (spread > 15) zoom = 3;
      else if (spread > 8) zoom = 4;
      else if (spread > 3) zoom = 5;
      else zoom = 6;

      setPosition({
        coordinates: [centerLng, centerLat],
        zoom,
      });
      setJumpKey(k => k + 1);
      onCountrySelect?.(dbName);
    },
    [cityData, onCountrySelect]
  );

  const handleDotClick = useCallback(
    (city: CityDot) => {
      // Center map on the clicked city
      setPosition(prev => ({
        coordinates: [city.lng, city.lat],
        zoom: Math.max(prev.zoom, 6),
      }));
      setJumpKey(k => k + 1);
      tooltipDataRef.current = null;
      setTooltipCity(null);
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

  const handleMarkerEnter = useCallback(
    (city: CityDot, e: React.MouseEvent) => {
      tooltipDataRef.current = city;
      setTooltipCity(city);
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 12}px`;
        tooltipRef.current.style.top = `${e.clientY - 12}px`;
      }
    },
    []
  );

  const handleMarkerLeave = useCallback(() => {
    tooltipDataRef.current = null;
    setTooltipCity(null);
  }, []);

  const isSelected = useCallback(
    (city: CityDot) =>
      selectedCity?.cityName === city.cityName &&
      selectedCity?.lat === city.lat &&
      selectedCity?.lng === city.lng,
    [selectedCity]
  );

  const zoom = position.zoom;
  // For stroke widths — just scale inversely with zoom
  const strokeScale = zoom;

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
          {cityData.map((city, i) => {
            const r = getDotRadius(
              city.artistCount,
              maxCount,
              zoom,
              isMobile
            );
            const tapR = isMobile
              ? Math.max(12 / zoom, r)
              : 0;
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
      {!isMobile && tooltipCity && (
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{ position: "fixed", pointerEvents: "none" }}
        >
          <div className={styles.tooltipCity}>
            {[
              tooltipCity.cityName,
              tooltipCity.stateName,
              tooltipCity.countryName,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
          <div className={styles.tooltipCount}>
            {tooltipCity.artistCount}{" "}
            {tooltipCity.artistCount === 1 ? "artist" : "artists"}
            {tooltipCity.shopCount ? (
              <>
                {" "}
                &middot; {tooltipCity.shopCount}{" "}
                {tooltipCity.shopCount === 1 ? "shop" : "shops"}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
