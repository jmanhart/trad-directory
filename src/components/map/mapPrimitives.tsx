import { useState, useEffect } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

// Shared map primitives used by both the full MapView (/map) and the scoped
// SearchResultMapPreview (search results). Keeping these in one module avoids
// duplicating the token-free MapLibre style + border-loading logic.

export const WORLD_GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
export const US_STATES_GEO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Minimal map style with just a background color — we add our own GeoJSON layers
export const MAP_STYLE = {
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
            coordinates: g.coordinates.map(poly => poly.map(normalizeRing)),
          },
        };
      }
      return f;
    }),
  };
}

// Custom hook to fetch and convert TopoJSON to GeoJSON
export function useGeoJSON(url: string, objectKey: string) {
  const [data, setData] = useState<FeatureCollection<Geometry> | null>(null);
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

// Static country + US-state borders for non-interactive previews.
// The full MapView renders its own hover-aware layers instead.
const COUNTRY_FILL = { "fill-color": "#e9e9ef" };
const STATE_FILL = { "fill-color": "#e9e9ef" };

export function MapBorders() {
  const worldGeoJSON = useGeoJSON(WORLD_GEO_URL, "countries");
  const usStatesGeoJSON = useGeoJSON(US_STATES_GEO_URL, "states");
  return (
    <>
      {worldGeoJSON && (
        <Source id="countries" type="geojson" data={worldGeoJSON} promoteId="name">
          <Layer
            id="countries-fill"
            type="fill"
            paint={COUNTRY_FILL}
            filter={["!=", ["get", "name"], "United States of America"]}
          />
          <Layer
            id="countries-line"
            type="line"
            paint={{ "line-color": "#ffffff", "line-width": 0.5 }}
            filter={["!=", ["get", "name"], "United States of America"]}
          />
        </Source>
      )}
      {usStatesGeoJSON && (
        <Source id="us-states" type="geojson" data={usStatesGeoJSON} promoteId="name">
          <Layer id="states-fill" type="fill" paint={STATE_FILL} />
          <Layer
            id="states-line"
            type="line"
            paint={{ "line-color": "#ffffff", "line-width": 0.3 }}
          />
        </Source>
      )}
    </>
  );
}
