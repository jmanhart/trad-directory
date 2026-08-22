import { useMemo } from "react";
import MapGL, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, MapBorders } from "./mapPrimitives";
import type { LocationMatch } from "../../utils/locationSearch";
import styles from "./SearchResultMapPreview.module.css";

interface SearchResultMapPreviewProps {
  match: LocationMatch;
}

// Single-city previews fly to a fixed neighborhood-level zoom; multi-city
// (country/state) previews fit the bounding box.
const CITY_ZOOM = 9;
const FIT_MAX_ZOOM = 7;

function markerSize(artistCount: number): number {
  const min = 14;
  const max = 34;
  const t = Math.min(1, Math.log10(artistCount + 1) / 3);
  return min + t * (max - min);
}

/**
 * Non-interactive, location-scoped map preview shown on the search results
 * page. It is deliberately not a map viewer: all pan/zoom/rotate handlers are
 * disabled so it reads as a static preview of where the results are, not a
 * navigation surface.
 */
export default function SearchResultMapPreview({
  match,
}: SearchResultMapPreviewProps) {
  const initialViewState = useMemo(() => {
    if (match.kind === "city" || match.dots.length <= 1) {
      const [d] = match.dots;
      return { longitude: d.lng, latitude: d.lat, zoom: CITY_ZOOM };
    }
    return {
      bounds: match.bounds,
      fitBoundsOptions: { padding: 40, maxZoom: FIT_MAX_ZOOM },
    };
  }, [match]);

  return (
    <div
      className={styles.wrapper}
      role="img"
      aria-label={`Map preview of tattoo results in ${match.name}`}
    >
      <MapGL
        // react-map-gl accepts bounds/fitBoundsOptions in initialViewState.
        initialViewState={initialViewState as never}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactive={false}
        attributionControl={false}
        maxZoom={CITY_ZOOM}
        minZoom={1}
      >
        <MapBorders />
        {match.dots.map(dot => {
          const size = markerSize(dot.artistCount);
          return (
            <Marker
              key={`${dot.cityName}-${dot.stateName ?? ""}`}
              longitude={dot.lng}
              latitude={dot.lat}
            >
              <div
                className={styles.dot}
                style={{ width: size, height: size }}
                title={`${dot.cityName}: ${dot.artistCount} artist${
                  dot.artistCount === 1 ? "" : "s"
                }`}
              >
                <span className={styles.count}>{dot.artistCount}</span>
              </div>
            </Marker>
          );
        })}
      </MapGL>
    </div>
  );
}
