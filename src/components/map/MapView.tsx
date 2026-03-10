import { useState, useMemo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import MapTooltip from "./MapTooltip";
import useIsMobile from "../../hooks/useIsMobile";
import styles from "./MapView.module.css";

const WORLD_GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface CityDot {
  cityName: string;
  stateName: string | null;
  countryName: string | null;
  lat: number;
  lng: number;
  artistCount: number;
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

interface MapViewProps {
  cityData: CityDot[];
  onCountrySelect?: (countryName: string | null) => void;
  onCityClick?: (city: CityDot) => void;
}

function getDotRadius(
  count: number,
  maxCount: number,
  isMobile: boolean
): number {
  const minR = isMobile ? 5 : 3;
  const maxR = isMobile ? 16 : 12;
  if (maxCount <= 1) return minR;
  const scale = Math.sqrt(count) / Math.sqrt(maxCount);
  return minR + scale * (maxR - minR);
}

function filterZoomEvent(event: { type: string; ctrlKey?: boolean }) {
  // Allow all touch events (pinch-to-zoom)
  if ("touches" in event) return true;
  // Allow mouse drag for panning
  if (event.type === "mousemove" || event.type === "mousedown") return true;
  // Block wheel zoom unless Ctrl is held
  if (event.type === "wheel") return !!event.ctrlKey;
  return true;
}

export default function MapView({
  cityData,
  onCountrySelect,
  onCityClick,
}: MapViewProps) {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState<
    (CityDot & { x: number; y: number }) | null
  >(null);
  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({ coordinates: [0, 30], zoom: 1 });
  // Counter to force ZoomableGroup remount on programmatic jumps
  const [jumpKey, setJumpKey] = useState(0);

  const maxCount = useMemo(
    () => Math.max(1, ...cityData.map(d => d.artistCount)),
    [cityData]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hovered) {
      setHovered(prev =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
      );
    }
  };

  const handleZoomIn = () =>
    setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }));
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

  return (
    <div className={styles.mapWrapper} onMouseMove={handleMouseMove}>
      <div className={styles.zoomControls}>
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
          maxZoom={8}
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
                    onClick={() => handleCountryClick(geoName)}
                    style={{
                      default: {
                        fill: "var(--gray-200)",
                        outline: "none",
                      },
                      hover: {
                        fill: "var(--gray-300)",
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "var(--gray-300)",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {cityData.map((city, i) => {
            const baseR = getDotRadius(city.artistCount, maxCount, isMobile);
            const r = isMobile
              ? Math.max(4, baseR / Math.sqrt(position.zoom))
              : baseR / position.zoom;
            const tapR = isMobile
              ? Math.max(10, r)
              : 0;
            return (
              <Marker
                key={`${city.cityName}-${city.lat}-${city.lng}-${i}`}
                coordinates={[city.lng, city.lat]}
              >
                {isMobile && tapR > r && (
                  <circle
                    r={tapR}
                    fill="transparent"
                    onClick={() => onCityClick?.(city)}
                    style={{ cursor: "pointer" }}
                  />
                )}
                <circle
                  r={r}
                  fill="var(--color-primary)"
                  fillOpacity={0.8}
                  stroke="var(--color-surface)"
                  strokeWidth={1 / position.zoom}
                  onMouseEnter={
                    isMobile
                      ? undefined
                      : e => {
                          setHovered({
                            ...city,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }
                  }
                  onClick={() => onCityClick?.(city)}
                  onMouseLeave={
                    isMobile ? undefined : () => setHovered(null)
                  }
                  style={{ cursor: "pointer" }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      {!isMobile && hovered && (
        <MapTooltip
          cityName={hovered.cityName}
          stateName={hovered.stateName}
          countryName={hovered.countryName}
          artistCount={hovered.artistCount}
          x={hovered.x}
          y={hovered.y}
        />
      )}
    </div>
  );
}
