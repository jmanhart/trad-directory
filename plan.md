# Plan: Zoom to country boundaries (not data bounds) on country click

## Problem

When clicking a country, the map calculates zoom from the **city dot positions**, giving a tight crop around artist data. The user wants to see the **whole country in context** with city dots overlaid — the same way US state clicks use `flyToStateBounds` with actual GeoJSON boundaries.

## Approach

Create a `flyToCountryBounds` function (mirroring `flyToStateBounds`) that uses the `worldGeoJSON` country boundary to calculate the bounding box, then calls `fitBounds`. Both country click handlers will use this instead of manual zoom calculation.

## Changes

### 1. `src/components/map/MapView.tsx` — Add `flyToCountryBounds`

Add a new function right after `flyToStateBounds` (~line 756) that:
- Looks up the country feature in `worldGeoJSON` by name
- Handles the DB→GeoJSON name mapping (e.g. "United States" → "United States of America")
- Walks the GeoJSON coordinates to find the bounding box (same `walkCoords` pattern as `flyToStateBounds`)
- Calls `mapRef.current.fitBounds()` with padding
- Estimates the resulting zoom and syncs tier with `Math.max(estimatedZoom, ZOOM_CITY)` to ensure city dots render

```typescript
const flyToCountryBounds = useCallback(
  (countryName: string) => {
    if (!worldGeoJSON || !mapRef.current) return false;

    const geoName = COUNTRY_NAME_MAP[countryName] || countryName;
    const feat = worldGeoJSON.features.find(
      (f: any) => f.properties?.name === geoName || f.properties?.name === countryName
    );
    if (!feat) return false;

    // Walk coordinates to find bounding box (same as flyToStateBounds)
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    const walkCoords = (coords: unknown) => { /* same logic */ };
    walkCoords(feat.geometry.coordinates);
    if (!isFinite(minLng)) return false;

    mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: getMapPadding(),
      duration: 1000,
    });

    const span = Math.max(maxLng - minLng, maxLat - minLat, 0.5);
    const estimatedZoom = Math.log2(360 / span) + 0.5;
    syncTier(Math.max(estimatedZoom, ZOOM_CITY));
    return true;
  },
  [worldGeoJSON, syncTier]
);
```

Returns `true` if bounds were found so callers can fall back to data-based zoom if the country isn't in the GeoJSON.

### 2. `src/components/map/MapView.tsx` — Update `handleCountryClick` (GeoJSON boundary click)

Replace the data-spread zoom calculation with a call to `flyToCountryBounds(dbName)`. Fall back to existing data-based logic if the country isn't found in GeoJSON (shouldn't happen since the click came from GeoJSON, but defensive).

### 3. `src/components/map/MapView.tsx` — Update `handleCountryClusterClick` (cluster dot click)

For non-US countries, call `flyToCountryBounds(cluster.name)` instead of the data-spread zoom calculation. Fall back to data-center zoom at ZOOM_CITY if not found in GeoJSON.

## Files modified

- `src/components/map/MapView.tsx` — add `flyToCountryBounds`, simplify both click handlers

## What stays the same

- US state clicks still use `flyToStateBounds` (unchanged)
- Continent clicks still use their existing fixed zoom (unchanged)
- Countries without data still do nothing on click (existing guard)
- The `onCountrySelect` callback and `ensureArtistsLoaded` preloading from the previous change stay in place
