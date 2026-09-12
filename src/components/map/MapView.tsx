import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import MapGL, {
  Source,
  Layer,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MAP_STYLE,
  WORLD_GEO_URL,
  useGeoJSON,
} from "./mapPrimitives";
import type { MapLayerMouseEvent, ViewStateChangeEvent } from "react-map-gl";
import useIsMobile from "../../hooks/useIsMobile";
import styles from "./MapView.module.css";

// City-tier zoom threshold (MapLibre zoom level)
const ZOOM_CITY = 6.5;

// Default opening camera for the 3D globe (US-centered overview). Geo may
// rotate it to the visitor's region at the same zoom.
const DEFAULT_CENTER: [number, number] = [-97, 39];
const DEFAULT_ZOOM = 2.6;


// Countries whose artist data is rich enough to drill down to individual
// states/provinces (state clustering on the map + state breadcrumb in the
// panel). Single source of truth, also imported by MapPage.
export const STATE_HAVING_COUNTRIES = new Set([
  "United States",
  "Canada",
  "Australia",
]);

// Panel-aware padding for map zoom/fit operations
const PANEL_WIDTH = 400; // 340px panel + gap + breathing room

function getMapPadding(opensPanel = true) {
  const isDesktop = window.innerWidth > 767;
  if (isDesktop) {
    return { top: 80, bottom: 50, left: PANEL_WIDTH, right: 50 };
  }
  // Mobile: reserve room for the bottom sheet's peek height (~33vh, matching
  // useBottomSheet SNAP_HEIGHTS.peek) so a selected dot isn't centered behind
  // the sheet — but only when this navigation opens a panel. Pure cluster-zoom
  // exploration keeps the target centered in the full viewport.
  const bottom = opensPanel ? Math.round(window.innerHeight * 0.33) + 24 : 50;
  return { top: 50, bottom, left: 50, right: 50 };
}

export interface CityDot {
  id?: number;
  cityName: string;
  stateName: string | null;
  countryName: string | null;
  continent: string | null;
  lat: number;
  lng: number;
  artistCount: number;
  shopCount: number;
  unshoppedCount: number;
}

export interface ShopPin {
  id: number;
  cityId: number;
  shopName: string;
  lat: number;
  lng: number;
  artistCount: number;
}

interface MapViewProps {
  cityData: CityDot[];
  loading?: boolean;
  onCountrySelect?: (countryName: string | null) => void;
  onCityClick?: (city: CityDot) => void;
  onStateClick?: (stateName: string) => void;
  selectedCity?: CityDot | null;
  highlightedCity?: CityDot | null;
  flyTo?: {
    coordinates: [number, number];
    zoom: number;
    fitCityId?: number;
  } | null;
  flyToKey?: number;
  onBackgroundClick?: () => void;
  /** Whether any detail panel/card is currently open (drives recenter-on-close). */
  panelOpen?: boolean;
  /** Shops with geocoded coordinates — dropped as pins at city zoom. */
  shops?: ShopPin[];
  onShopClick?: (shop: {
    id: number;
    shop_name: string;
    slug?: string | null;
  }) => void;
}

// Perceptual (~sqrt) radius ramp — area grows with count but with diminishing
// returns so a mega-cluster doesn't swallow the map. `prop` is the summed count
// field ("artists" on clusters, "artistCount" on individual city points).
const dotRadius = (prop: string) =>
  [
    "interpolate",
    ["linear"],
    ["sqrt", ["max", ["get", prop], 1]],
    1, 7,
    2.5, 11,
    5, 16,
    9, 22,
    16, 30,
    26, 40,
  ] as unknown as number;

// Subtle warm ramp: light terracotta -> burnt orange -> deep sienna as count rises.
const dotColor = (prop: string) =>
  [
    "interpolate",
    ["linear"],
    ["get", prop],
    1, "#dd9b76",
    6, "#d07a4e",
    18, "#c2410c",
    45, "#9a3412",
    120, "#7a1f1a",
  ] as unknown as string;

// Shops fade in as you zoom into a metro (city dots stay); shop labels only at
// the closest zoom so they don't pile up.
const SHOP_FADE_CIRCLE = [
  "interpolate", ["linear"], ["zoom"], 9, 0, 11, 0.92,
] as unknown as number;
const SHOP_FADE_TEXT = [
  "interpolate", ["linear"], ["zoom"], 9, 0, 11, 1,
] as unknown as number;
const SHOP_LABEL_OPACITY = [
  "interpolate", ["linear"], ["zoom"], 12, 0, 13.5, 1,
] as unknown as number;

// City aggregate dots cross-fade out at close zoom *only where the city has
// shops*, so its shop circles take over without shopless cities vanishing.
const CITY_FADE_WHEN_SHOPPED = [
  "interpolate",
  ["linear"],
  ["zoom"],
  10, 0.92,
  12, ["case", [">", ["get", "shopCount"], 0], 0, 0.92],
] as unknown as number;

// Inner component with map logic
function MapInner({
  cityData,
  onCountrySelect,
  onCityClick,
  flyTo,
  flyToKey = 0,
  onBackgroundClick,
  panelOpen,
  shops = [],
  onShopClick,
}: MapViewProps) {
  const isMobile = useIsMobile();
  const mapRef = useRef<MapRef>(null);

  // Approximate visitor location (Vercel edge geo, no permission prompt) used
  // to rotate the opening globe to the user's region at the same overview zoom.
  const geoTargetRef = useRef<[number, number] | null>(null);
  const geoAppliedRef = useRef(false);
  const mapLoadedRef = useRef(false);

  const applyGeoStart = useCallback(() => {
    if (
      geoAppliedRef.current ||
      !geoTargetRef.current ||
      !mapLoadedRef.current ||
      !mapRef.current
    )
      return;
    geoAppliedRef.current = true;
    mapRef.current.easeTo({
      center: geoTargetRef.current,
      zoom: DEFAULT_ZOOM,
      duration: 1400,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.VITE_API_URL || "/api";
    fetch(`${base}/geo`)
      .then(r => (r.ok ? r.json() : null))
      .then((geo: unknown) => {
        if (cancelled || !geo || typeof geo !== "object") return;
        const g = geo as { lat?: unknown; lng?: unknown };
        if (typeof g.lat !== "number" || typeof g.lng !== "number") return;
        const lat = Math.max(-55, Math.min(65, g.lat));
        geoTargetRef.current = [g.lng, lat];
        applyGeoStart();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [applyGeoStart]);

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

  // Load GeoJSON data
  const worldGeoJSON = useGeoJSON(WORLD_GEO_URL, "countries");
  // State/province boundaries render from a self-hosted PMTiles vector tileset
  // (US states + Canada + Australia, one "states" layer) — per-zoom LOD keeps
  // coastlines crisp on zoom-in while only loading visible tiles.

  // Keep zoom state + ref in sync with the map's zoom
  const syncTier = useCallback((z: number) => {
    zoomRef.current = z;
    setZoom(z);
  }, []);

  // Handle map zoom changes
  const handleZoom = useCallback(
    (e: ViewStateChangeEvent) => {
      // The globe lets wheel/buttons overshoot minZoom, so hard-cap zoom-out
      // at the default so the opening framing is the most zoomed-out state.
      if (e.viewState.zoom < DEFAULT_ZOOM) {
        mapRef.current?.setZoom(DEFAULT_ZOOM);
        return;
      }
      syncTier(e.viewState.zoom);
    },
    [syncTier]
  );

  // Fit the viewport to a city's shop pins so the individual dots are framed
  // (used by both map-dot clicks and search/deep-link selection). Falls back to
  // a fixed city-detail zoom when the city has no geocoded shops.
  const fitCityShops = useCallback(
    (cityId: number | null | undefined, center: [number, number]) => {
      if (!mapRef.current) return;
      const cityShops =
        cityId != null ? shops.filter(s => s.cityId === cityId) : [];
      if (cityShops.length > 0) {
        let minLng = center[0],
          maxLng = center[0],
          minLat = center[1],
          maxLat = center[1];
        cityShops.forEach(s => {
          if (s.lng < minLng) minLng = s.lng;
          if (s.lng > maxLng) maxLng = s.lng;
          if (s.lat < minLat) minLat = s.lat;
          if (s.lat > maxLat) maxLat = s.lat;
        });
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: getMapPadding(), duration: 1000, maxZoom: 13 }
        );
        const span = Math.max(maxLng - minLng, maxLat - minLat, 0.02);
        const estimatedZoom = Math.min(Math.log2(360 / span) + 0.5, 13);
        syncTier(Math.max(estimatedZoom, ZOOM_CITY));
      } else {
        const zoom = 10.5;
        mapRef.current.flyTo({
          center,
          zoom,
          duration: 1000,
          padding: getMapPadding(),
        });
        syncTier(zoom);
      }
    },
    [shops, syncTier]
  );

  // Fly-to effect
  useEffect(() => {
    if (flyToKey > 0 && flyTo && mapRef.current) {
      if (flyTo.fitCityId != null) {
        fitCityShops(flyTo.fitCityId, flyTo.coordinates);
      } else {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToKey]);

  // Recenter-on-close: while a panel is open the map carries a large left
  // padding (PANEL_WIDTH) that shifts the globe to the right so it clears the
  // card. When the last panel closes, glide that padding back to zero so the
  // globe eases back to center. Kept slow/eased so it reads as a subtle settle,
  // not a jump.
  const prevPanelOpenRef = useRef(false);
  useEffect(() => {
    if (prevPanelOpenRef.current && !panelOpen && mapRef.current) {
      const m = mapRef.current;
      // eslint-disable-next-line no-console
      console.log("[recenter] fire; padding before =", JSON.stringify(m.getPadding?.()));
      m.easeTo({
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 650,
      });
      // eslint-disable-next-line no-console
      console.log("[recenter] easeTo called; padding after =", JSON.stringify(m.getPadding?.()));
    }
    prevPanelOpenRef.current = !!panelOpen;
  }, [panelOpen]);

  // TEMP DEBUG: expose map instance for live easeTo testing
  useEffect(() => {
    (window as unknown as { __map?: unknown }).__map = mapRef.current;
  });

  // Move tooltip via DOM
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipRef.current && tooltipDataRef.current) {
      tooltipRef.current.style.left = `${e.clientX + 12}px`;
      tooltipRef.current.style.top = `${e.clientY - 12}px`;
    }
  }, []);

  // Zoom controls
  const [projection, setProjection] = useState<"globe" | "mercator">(
    "globe"
  );
  const handleToggleProjection = useCallback(() => {
    setProjection(prev => {
      const next = prev === "globe" ? "mercator" : "globe";
      mapRef.current?.getMap().setProjection({ type: next });
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 });
  }, []);

  const handleReset = useCallback(() => {
    mapRef.current?.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      duration: 800,
    });
    syncTier(DEFAULT_ZOOM);
    onCountrySelect?.(null);
  }, [onCountrySelect, syncTier]);

  // Handle clicks on the map layers (countries, states)
  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feat = e.features?.[0];

      // Dot-density: cluster click expands to the next zoom; city point opens
      // the panel and fits the viewport to that city's shops.
      if (feat?.layer?.id === "clusters") {
        const clusterId = feat.properties?.cluster_id;
        const geom = feat.geometry;
        if (geom.type !== "Point") return;
        const coords: [number, number] = [
          geom.coordinates[0],
          geom.coordinates[1],
        ];
        // maplibre types getSource as the Source union; narrow to the clustered
        // GeoJSON source's runtime clustering API.
        const src = mapRef.current?.getSource("city-points") as
          | { getClusterExpansionZoom: (id: number) => Promise<number> }
          | undefined;
        if (src && clusterId != null) {
          src
            .getClusterExpansionZoom(clusterId)
            .then(z => {
              mapRef.current?.easeTo({
                center: coords,
                zoom: z + 0.3,
                duration: 600,
              });
              syncTier(z + 0.3);
            })
            .catch(() => {});
        }
        return;
      }
      if (feat?.layer?.id === "unclustered") {
        const p = feat.properties || {};
        const geom = feat.geometry;
        if (geom.type !== "Point") return;
        const coords: [number, number] = [
          geom.coordinates[0],
          geom.coordinates[1],
        ];
        const city: CityDot = {
          id: p.cityId,
          cityName: p.cityName,
          stateName: p.stateName ?? null,
          countryName: p.countryName ?? null,
          continent: null,
          lat: coords[1],
          lng: coords[0],
          artistCount: p.artistCount,
          shopCount: p.shopCount,
          unshoppedCount: 0,
        };
        fitCityShops(city.id, coords);
        onCityClick?.(city);
        return;
      }
      if (feat?.layer?.id === "shop-clusters") {
        const clusterId = feat.properties?.cluster_id;
        const geom = feat.geometry;
        if (geom.type !== "Point") return;
        const coords: [number, number] = [
          geom.coordinates[0],
          geom.coordinates[1],
        ];
        const src = mapRef.current?.getSource("shop-points") as
          | { getClusterExpansionZoom: (id: number) => Promise<number> }
          | undefined;
        if (src && clusterId != null) {
          src
            .getClusterExpansionZoom(clusterId)
            .then(z => {
              mapRef.current?.easeTo({
                center: coords,
                zoom: z + 0.3,
                duration: 600,
              });
              syncTier(z + 0.3);
            })
            .catch(() => {});
        }
        return;
      }
      if (feat?.layer?.id === "shop-unclustered") {
        const p = feat.properties || {};
        onShopClick?.({ id: p.shopId, shop_name: p.shopName });
        return;
      }

      if (!feat) {
        onBackgroundClick?.();
      }
    },
    [
      onBackgroundClick,
      fitCityShops,
      onCityClick,
      syncTier,
      onShopClick,
    ]
  );

  const handleMapMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const clearHover = () => {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
        if (tooltipDataRef.current) {
          tooltipDataRef.current = null;
          setTooltipData(null);
        }
      };
      if (!e.features || e.features.length === 0) {
        clearHover();
        return;
      }
      const feat = e.features[0];
      // Dot-density hover: pointer + tooltip on clusters and city points.
      if (feat.layer?.id === "clusters" || feat.layer?.id === "unclustered") {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
        const p = feat.properties || {};
        const data =
          feat.layer.id === "clusters"
            ? {
                name: "",
                stateName: null,
                countryName: null,
                artistCount: p.artists || 0,
                shopCount: 0,
              }
            : {
                name: p.cityName,
                stateName: p.stateName ?? null,
                countryName: p.countryName ?? null,
                artistCount: p.artistCount || 0,
                shopCount: p.shopCount || 0,
              };
        if (
          tooltipDataRef.current?.name !== data.name ||
          tooltipDataRef.current?.artistCount !== data.artistCount
        ) {
          tooltipDataRef.current = data;
          setTooltipData(data);
        }
        if (tooltipRef.current && e.originalEvent) {
          tooltipRef.current.style.left = `${e.originalEvent.clientX + 12}px`;
          tooltipRef.current.style.top = `${e.originalEvent.clientY - 12}px`;
        }
        return;
      }
      if (
        feat.layer?.id === "shop-clusters" ||
        feat.layer?.id === "shop-unclustered"
      ) {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
        if (feat.layer.id === "shop-unclustered") {
          const p = feat.properties || {};
          const data = {
            name: p.shopName,
            stateName: null,
            countryName: null,
            artistCount: p.artistCount || 0,
            shopCount: 0,
          };
          if (tooltipDataRef.current?.name !== data.name) {
            tooltipDataRef.current = data;
            setTooltipData(data);
          }
          if (tooltipRef.current && e.originalEvent) {
            tooltipRef.current.style.left = `${e.originalEvent.clientX + 12}px`;
            tooltipRef.current.style.top = `${e.originalEvent.clientY - 12}px`;
          }
        } else if (tooltipDataRef.current) {
          tooltipDataRef.current = null;
          setTooltipData(null);
        }
        return;
      }
    },
    []
  );

  const handleMapMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
    if (tooltipDataRef.current) {
      tooltipDataRef.current = null;
      setTooltipData(null);
    }
  }, []);

  // Artist counts per state/country drive the choropleth fill (deeper red =
  // more weight), built as MapLibre `match` expressions on the feature name
  // with a light-gray fallback for places that have no artists.
  const countryFillPaint = { "fill-color": "#e7ded2", "fill-opacity": 0.9 };
  const statesFillPaint = { "fill-color": "#e7ded2", "fill-opacity": 0.9 };

  // SPIKE: city points as a single clustered GeoJSON source (dot-density view).
  const cityGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: cityData
        .filter(d => d.artistCount > 0)
        .map(d => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [d.lng, d.lat],
          },
          properties: {
            cityId: d.id ?? -1,
            cityName: d.cityName,
            stateName: d.stateName,
            countryName: d.countryName,
            artistCount: d.artistCount,
            shopCount: d.shopCount,
          },
        })),
    }),
    [cityData]
  );

  // SPIKE: shops as a clustered GeoJSON source (fade in at close zoom).
  const shopGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: shops.map(s => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [s.lng, s.lat],
        },
        properties: {
          shopId: s.id,
          shopName: s.shopName,
          artistCount: s.artistCount,
        },
      })),
    }),
    [shops]
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
          onClick={handleToggleProjection}
          title={
            projection === "globe" ? "Switch to flat map" : "Switch to globe"
          }
        >
          {projection === "globe" ? "2D" : "3D"}
        </button>
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
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onLoad={() => {
          mapLoadedRef.current = true;
          applyGeoStart();
        }}
        onZoom={handleZoom}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        interactiveLayerIds={
          zoom >= 9.5
            ? ["clusters", "unclustered", "shop-clusters", "shop-unclustered"]
            : ["clusters", "unclustered"]
        }
        scrollZoom={{
          around: "center",
        }}
        maxZoom={18}
        minZoom={DEFAULT_ZOOM}
        attributionControl={false}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
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
              filter={["match", ["get", "name"], ["United States of America", "Canada", "Australia"], false, true]}
            />
            <Layer
              id="countries-line"
              type="line"
              paint={{
                "line-color": "#ffffff",
                "line-width": 0.5,
              }}
              filter={["match", ["get", "name"], ["United States of America", "Canada", "Australia"], false, true]}
            />
          </Source>
        )}

        {/* State / province borders: US states, Canada provinces, Australia
            states — one layer, choropleth-filled by artist count. */}
        <Source
          id="us-states"
          type="vector"
          url="pmtiles:///geo/states.pmtiles"
          promoteId="name"
        >
          <Layer
            id="states-fill"
            type="fill"
            source-layer="states"
            paint={statesFillPaint}
          />
          <Layer
            id="states-line"
            type="line"
            source-layer="states"
            paint={{
              "line-color": "#ffffff",
              "line-width": 0.3,
            }}
          />
        </Source>

        {/* Limited road network from open vector tiles (OpenFreeMap, keyless):
            motorway + trunk, solid light gray with round joins so overlapping
            segments read as one smooth color (no opacity stacking). */}
        {worldGeoJSON && (
        <Source
          id="osm-vector"
          type="vector"
          url="https://tiles.openfreemap.org/planet"
        >
          {/* Water — replaces flat white with a soft tint, fading in on zoom */}
          <Layer
            id="water"
            type="fill"
            source-layer="water"
            paint={{
              "fill-color": "#dbe5eb",
              "fill-opacity": [
                "interpolate", ["linear"], ["zoom"], 4, 0, 7, 0.9,
              ] as unknown as number,
            }}
          />
          {/* Green land cover (woods/grass/parks) — muted sage, city context */}
          <Layer
            id="landcover-green"
            type="fill"
            source-layer="landcover"
            filter={["match", ["get", "class"], ["wood", "grass", "scrub", "farmland"], true, false]}
            paint={{
              "fill-color": "#d0d4b6",
              "fill-opacity": [
                "interpolate", ["linear"], ["zoom"], 8, 0, 11, 0.5,
              ] as unknown as number,
            }}
          />
          {/* Rivers / streams */}
          <Layer
            id="waterways"
            type="line"
            source-layer="waterway"
            paint={{
              "line-color": "#bcccd4",
              "line-width": [
                "interpolate", ["linear"], ["zoom"], 9, 0.3, 14, 1.5,
              ] as unknown as number,
              "line-opacity": [
                "interpolate", ["linear"], ["zoom"], 8, 0, 10, 1,
              ] as unknown as number,
            }}
          />
          {/* Minor / residential streets — appear at street zoom */}
          <Layer
            id="roads-minor"
            type="line"
            source-layer="transportation"
            filter={["match", ["get", "class"], ["minor", "service", "tertiary"], true, false]}
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#cbcdcf",
              "line-width": [
                "interpolate", ["linear"], ["zoom"], 12, 0.3, 16, 2.5,
              ] as unknown as number,
              "line-opacity": [
                "interpolate", ["linear"], ["zoom"], 11, 0, 13, 1,
              ] as unknown as number,
            }}
          />
          {/* Primary / secondary roads */}
          <Layer
            id="roads-major"
            type="line"
            source-layer="transportation"
            filter={["match", ["get", "class"], ["primary", "secondary"], true, false]}
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#bfc2c5",
              "line-width": [
                "interpolate", ["linear"], ["zoom"], 8, 0.4, 12, 2, 16, 4,
              ] as unknown as number,
              "line-opacity": [
                "interpolate", ["linear"], ["zoom"], 7, 0, 9, 1,
              ] as unknown as number,
            }}
          />
          {/* Motorways / trunk */}
          <Layer
            id="highways"
            type="line"
            source-layer="transportation"
            filter={["match", ["get", "class"], ["motorway", "trunk"], true, false]}
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#b0b6be",
              "line-width": [
                "interpolate", ["linear"], ["zoom"], 4, 0.4, 8, 1, 12, 2.5, 16, 5,
              ] as unknown as number,
            }}
          />
          {/* Street names — appear at street zoom, placed along the road line */}
          <Layer
            id="street-labels"
            type="symbol"
            source-layer="transportation_name"
            filter={["match", ["get", "class"], ["primary", "secondary", "tertiary", "minor", "residential"], true, false]}
            layout={{
              "symbol-placement": "line",
              "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]] as unknown as string,
              "text-font": ["Noto Sans Regular"],
              "text-size": 11,
            }}
            paint={{
              "text-color": "#8a7a68",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.2,
              "text-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14, 1] as unknown as number,
            }}
          />
        </Source>
        )}

        {/* SPIKE: dot-density — all city points in one clustered GeoJSON source.
            Circles sized + colored by artist count; clusters aggregate by
            proximity and split into individual city dots as you zoom. */}
        {cityData.length > 0 && (
          <Source
            id="city-points"
            type="geojson"
            data={cityGeoJSON}
            cluster
            clusterMaxZoom={8}
            clusterRadius={20}
            clusterProperties={
              {
                artists: ["+", ["get", "artistCount"]],
                // Track the highest-count member so a cluster can label itself
                // with its dominant metro. Packed "0042|City" (zero-padded count
                // so string-max picks the biggest city); the label layer unpacks it.
                dominant: [
                  [
                    "case",
                    [">", ["get", "dominant"], ["accumulated"]],
                    ["get", "dominant"],
                    ["accumulated"],
                  ],
                  [
                    "concat",
                    [
                      "slice",
                      ["concat", "0000", ["to-string", ["get", "artistCount"]]],
                      -4,
                    ],
                    "|",
                    ["get", "cityName"],
                  ],
                ],
              } as unknown as Record<string, unknown>
            }
          >
            <Layer
              id="clusters"
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-radius": dotRadius("artists"),
                "circle-color": dotColor("artists"),
                "circle-opacity": 0.92,
              }}
            />
            <Layer
              id="cluster-count"
              type="symbol"
              filter={["has", "point_count"]}
              layout={{
                "text-field": ["to-string", ["get", "artists"]] as unknown as string,
                "text-font": ["Noto Sans Regular"],
                "text-size": 11,
                "text-allow-overlap": true,
              }}
              paint={{ "text-color": "#ffffff" }}
            />
            <Layer
              id="cluster-label"
              type="symbol"
              filter={["has", "point_count"]}
              layout={{
                "text-field": [
                  "slice",
                  ["get", "dominant"],
                  ["+", ["index-of", "|", ["get", "dominant"]], 1],
                ] as unknown as string,
                "text-font": ["Noto Sans Regular"],
                "text-size": 11,
                "text-variable-anchor": ["top", "bottom", "left", "right"],
                "text-radial-offset": 1.1,
                "text-justify": "auto",
                "text-padding": 1,
                "symbol-sort-key": ["-", 0, ["get", "artists"]] as unknown as number,
              }}
              paint={{
                "text-color": "#5c4a3a",
                "text-halo-color": "#f3efe9",
                "text-halo-width": 1.4,
              }}
            />
            <Layer
              id="unclustered"
              type="circle"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-radius": dotRadius("artistCount"),
                "circle-color": dotColor("artistCount"),
                "circle-opacity": CITY_FADE_WHEN_SHOPPED,
              }}
            />
            <Layer
              id="unclustered-count"
              type="symbol"
              filter={["!", ["has", "point_count"]]}
              layout={{
                "text-field": ["to-string", ["get", "artistCount"]] as unknown as string,
                "text-font": ["Noto Sans Regular"],
                "text-size": 10,
                "text-allow-overlap": true,
              }}
              paint={{
                "text-color": "#ffffff",
                "text-opacity": CITY_FADE_WHEN_SHOPPED,
              }}
            />
            <Layer
              id="unclustered-label"
              type="symbol"
              filter={["!", ["has", "point_count"]]}
              layout={{
                "text-field": ["get", "cityName"] as unknown as string,
                "text-font": ["Noto Sans Regular"],
                "text-size": 10,
                "text-variable-anchor": ["top", "bottom", "left", "right"],
                "text-radial-offset": 0.9,
                "text-justify": "auto",
                "text-padding": 1,
                "symbol-sort-key": ["-", 0, ["get", "artistCount"]] as unknown as number,
              }}
              paint={{
                "text-color": "#5c4a3a",
                "text-halo-color": "#f3efe9",
                "text-halo-width": 1.4,
                "text-opacity": CITY_FADE_WHEN_SHOPPED,
              }}
            />
          </Source>
        )}

        {/* SPIKE: shops as a second clustered source — fade in as you zoom into
            a metro (red circles) so a shop-dense city reads as many circles. */}
        {shops.length > 0 && (
          <Source
            id="shop-points"
            type="geojson"
            data={shopGeoJSON}
            cluster
            clusterMaxZoom={12}
            clusterRadius={26}
          >
            <Layer
              id="shop-clusters"
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["get", "point_count"],
                  2, 12,
                  10, 22,
                  30, 32,
                ] as unknown as number,
                "circle-color": "#c0392b",
                "circle-opacity": SHOP_FADE_CIRCLE,
              }}
            />
            <Layer
              id="shop-cluster-count"
              type="symbol"
              filter={["has", "point_count"]}
              layout={{
                "text-field": ["to-string", ["get", "point_count"]] as unknown as string,
                "text-font": ["Noto Sans Regular"],
                "text-size": 11,
                "text-allow-overlap": true,
              }}
              paint={{ "text-color": "#ffffff", "text-opacity": SHOP_FADE_TEXT }}
            />
            <Layer
              id="shop-unclustered"
              type="circle"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-radius": 7,
                "circle-color": "#c0392b",
                "circle-opacity": SHOP_FADE_CIRCLE,
              }}
            />
            <Layer
              id="shop-unclustered-label"
              type="symbol"
              filter={["!", ["has", "point_count"]]}
              layout={{
                "text-field": ["get", "shopName"] as unknown as string,
                "text-font": ["Noto Sans Regular"],
                "text-size": 10,
                "text-anchor": "top",
                "text-offset": [0, 0.9],
              }}
              paint={{
                "text-color": "#7a2318",
                "text-halo-color": "#f3efe9",
                "text-halo-width": 1.4,
                "text-opacity": SHOP_LABEL_OPACITY,
              }}
            />
          </Source>
        )}

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
