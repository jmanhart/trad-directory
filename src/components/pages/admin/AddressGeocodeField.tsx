import { useState, useEffect } from "react";
import { FormGroup, Label, Input } from "./AdminFormComponents";
import { geocodeAddressPreview } from "../../../services/adminApi";
import styles from "./AddressGeocodeField.module.css";

/**
 * Address + coordinate tool for the admin shop add/edit forms.
 *
 * - "Check address" geocodes the street address (via /api/geocodeAddress) and,
 *   on success, auto-fills the coordinate field and shows an OpenStreetMap
 *   preview with a marker so the exact spot can be confirmed before saving.
 * - When geocoding can't find the address (free OSM data is patchy on exact
 *   house numbers), the admin can paste coordinates manually — e.g. from Google
 *   Maps (right-click → copy the lat/lng) — and the preview updates.
 *
 * The resolved coordinates are lifted to the parent via `onCoordsChange` and
 * sent to addShop/updateShop, which store them verbatim (explicit coords win
 * over server-side geocoding). Passing the selected city's name/state/country
 * lets partial addresses resolve and disambiguates same-named cities.
 */
interface AddressGeocodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  latitude: number | null;
  longitude: number | null;
  onCoordsChange: (lat: number | null, lng: number | null) => void;
  cityName?: string | null;
  stateName?: string | null;
  countryName?: string | null;
  id?: string;
  label?: string;
}

type CheckStatus = "idle" | "checking" | "found" | "notfound" | "error";

function parseLatLng(text: string): { lat: number; lng: number } | null {
  const m = text
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export default function AddressGeocodeField({
  value,
  onChange,
  latitude,
  longitude,
  onCoordsChange,
  cityName,
  stateName,
  countryName,
  id = "address",
  label = "Address",
}: AddressGeocodeFieldProps) {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [coordText, setCoordText] = useState(
    latitude != null && longitude != null ? `${latitude}, ${longitude}` : ""
  );

  // Seed the coordinate field when existing coords arrive (the edit form loads
  // the shop asynchronously, so props are null on first render).
  useEffect(() => {
    if (!coordText && latitude != null && longitude != null) {
      setCoordText(`${latitude}, ${longitude}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const applyCoordText = (text: string) => {
    setCoordText(text);
    const parsed = parseLatLng(text);
    onCoordsChange(parsed?.lat ?? null, parsed?.lng ?? null);
  };

  const check = async () => {
    const address = value.trim();
    if (!address) return;
    setStatus("checking");
    setErrorMsg("");
    try {
      const { lat, lng } = await geocodeAddressPreview({
        address,
        city_name: cityName,
        state_name: stateName,
        country_name: countryName,
      });
      if (lat != null && lng != null) {
        setStatus("found");
        applyCoordText(`${lat}, ${lng}`);
      } else {
        setStatus("notfound");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Geocode failed");
    }
  };

  const coords = parseLatLng(coordText);

  return (
    <>
      <FormGroup>
        <Label htmlFor={id}>{label}</Label>
        <div className={styles.row}>
          <Input
            type="text"
            id={id}
            value={value}
            onChange={e => {
              onChange(e.target.value);
              setStatus("idle");
            }}
            placeholder="Street address"
          />
          <button
            type="button"
            className={styles.checkButton}
            onClick={check}
            disabled={!value.trim() || status === "checking"}
          >
            {status === "checking" ? "Checking…" : "Check address"}
          </button>
        </div>
        {status === "found" && (
          <p className={styles.found}>✓ Located from address</p>
        )}
        {status === "notfound" && (
          <p className={styles.warn}>
            ⚠️ Couldn't locate this address. Enter coordinates manually below, or
            save without a pin (it'll be flagged “Not geocoded”).
          </p>
        )}
        {status === "error" && (
          <p className={styles.warn}>Geocode error: {errorMsg}</p>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor={`${id}_coords`}>Coordinates (lat, lng)</Label>
        <Input
          type="text"
          id={`${id}_coords`}
          value={coordText}
          onChange={e => applyCoordText(e.target.value)}
          placeholder="e.g. 41.53699, -87.44848"
        />
        <p className={styles.hint}>
          Auto-filled by “Check address”, or paste from Google Maps (right-click →
          the coordinates at the top → copy).
        </p>
        {coords && (
          <div className={styles.preview}>
            <p className={styles.found}>
              Pin at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
            <iframe
              className={styles.map}
              title="Location preview"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                coords.lng - 0.008
              }%2C${coords.lat - 0.006}%2C${coords.lng + 0.008}%2C${
                coords.lat + 0.006
              }&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
            />
            <a
              className={styles.osmLink}
              href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in OpenStreetMap ↗
            </a>
          </div>
        )}
      </FormGroup>
    </>
  );
}
