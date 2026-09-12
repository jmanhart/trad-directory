import { useState } from "react";
import { FormGroup, Label, Input } from "./AdminFormComponents";
import { geocodeAddressPreview } from "../../../services/adminApi";
import styles from "./AddressGeocodeField.module.css";

/**
 * Address input with a "Check address" tool for the admin shop add/edit forms.
 *
 * Lets an admin confirm where a street address geocodes to *before* saving:
 * clicking "Check address" hits /api/geocodeAddress and, on success, shows the
 * resolved coordinates plus an OpenStreetMap preview with a marker so the exact
 * spot can be eyeballed. It's advisory only — the server re-geocodes the address
 * on save (addShop/updateShop), so a shop still saves even if the check fails
 * (it just lands flagged "Not geocoded" in the data table).
 *
 * Pass the selected city's name/state/country so partial addresses resolve and
 * same-named cities (Portland OR vs ME) disambiguate correctly.
 */
interface AddressGeocodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  cityName?: string | null;
  stateName?: string | null;
  countryName?: string | null;
  id?: string;
  label?: string;
}

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "found"; lat: number; lng: number }
  | { status: "notfound" }
  | { status: "error"; message: string };

export default function AddressGeocodeField({
  value,
  onChange,
  cityName,
  stateName,
  countryName,
  id = "address",
  label = "Address",
}: AddressGeocodeFieldProps) {
  const [state, setState] = useState<CheckState>({ status: "idle" });

  const check = async () => {
    const address = value.trim();
    if (!address) return;
    setState({ status: "checking" });
    try {
      const { lat, lng } = await geocodeAddressPreview({
        address,
        city_name: cityName,
        state_name: stateName,
        country_name: countryName,
      });
      setState(
        lat != null && lng != null
          ? { status: "found", lat, lng }
          : { status: "notfound" }
      );
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Geocode failed",
      });
    }
  };

  return (
    <FormGroup>
      <Label htmlFor={id}>{label}</Label>
      <div className={styles.row}>
        <Input
          type="text"
          id={id}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setState({ status: "idle" });
          }}
          placeholder="Street address"
        />
        <button
          type="button"
          className={styles.checkButton}
          onClick={check}
          disabled={!value.trim() || state.status === "checking"}
        >
          {state.status === "checking" ? "Checking…" : "Check address"}
        </button>
      </div>

      {state.status === "found" && (
        <div className={styles.preview}>
          <p className={styles.found}>
            ✓ Located at {state.lat.toFixed(5)}, {state.lng.toFixed(5)}
          </p>
          <iframe
            className={styles.map}
            title="Address location preview"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              state.lng - 0.008
            }%2C${state.lat - 0.006}%2C${state.lng + 0.008}%2C${
              state.lat + 0.006
            }&layer=mapnik&marker=${state.lat}%2C${state.lng}`}
          />
          <a
            className={styles.osmLink}
            href={`https://www.openstreetmap.org/?mlat=${state.lat}&mlon=${state.lng}#map=16/${state.lat}/${state.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in OpenStreetMap ↗
          </a>
        </div>
      )}
      {state.status === "notfound" && (
        <p className={styles.warn}>
          ⚠️ Couldn't locate this address. You can still save — the shop will be
          flagged “Not geocoded” until the address is corrected.
        </p>
      )}
      {state.status === "error" && (
        <p className={styles.warn}>Geocode error: {state.message}</p>
      )}
    </FormGroup>
  );
}
