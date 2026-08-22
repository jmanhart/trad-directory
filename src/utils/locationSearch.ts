import type { CityDot } from "../components/map/MapView";

export type LocationKind = "country" | "state" | "city";

export interface LocationMatch {
  kind: LocationKind;
  /** Canonical display name of the matched location. */
  name: string;
  /** City dots (with coordinates) scoped to this location. */
  dots: CityDot[];
  /** Bounding box as [[minLng, minLat], [maxLng, maxLat]]. */
  bounds: [[number, number], [number, number]];
  /** Weighted center [lng, lat]. */
  center: [number, number];
  /** Suggested zoom derived from the bounding-box spread. */
  zoom: number;
}

function computeGeo(dots: CityDot[]): Pick<
  LocationMatch,
  "bounds" | "center" | "zoom"
> {
  const lats = dots.map(d => d.lat);
  const lngs = dots.map(d => d.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const center: [number, number] = [
    (minLng + maxLng) / 2,
    (minLat + maxLat) / 2,
  ];
  const spread = Math.max(maxLat - minLat, maxLng - minLng, 1);
  let zoom: number;
  if (spread > 30) zoom = 2;
  else if (spread > 15) zoom = 3;
  else if (spread > 8) zoom = 4;
  else if (spread > 3) zoom = 5;
  else zoom = 6;
  return {
    bounds: [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    center,
    zoom,
  };
}

/**
 * Classify a search query as a location by exact-matching it against the
 * country / state / city names present in the map city dots. Returns the
 * scoped dots + viewport geometry, or null when the query is not a location
 * (i.e. it's an artist/shop/free-text search).
 *
 * Exact matching (not substring) keeps entity names like an artist called
 * "Paris" from being misclassified unless they truly name a mapped place.
 */
export function classifyLocationQuery(
  query: string,
  cityDots: CityDot[]
): LocationMatch | null {
  const q = query.trim().toLowerCase();
  if (!q || cityDots.length === 0) return null;

  const countryDots = cityDots.filter(
    d => (d.countryName || "").toLowerCase() === q
  );
  if (countryDots.length > 0) {
    return {
      kind: "country",
      name: countryDots[0].countryName || query,
      dots: countryDots,
      ...computeGeo(countryDots),
    };
  }

  const stateDots = cityDots.filter(
    d => (d.stateName || "").toLowerCase() === q
  );
  if (stateDots.length > 0) {
    return {
      kind: "state",
      name: stateDots[0].stateName || query,
      dots: stateDots,
      ...computeGeo(stateDots),
    };
  }

  const cityMatches = cityDots.filter(d => d.cityName.toLowerCase() === q);
  if (cityMatches.length > 0) {
    return {
      kind: "city",
      name: cityMatches[0].cityName,
      dots: cityMatches,
      ...computeGeo(cityMatches),
    };
  }

  return null;
}
