import { useState, useMemo, useEffect, useRef } from "react";
import { FormGroup, Label, Select } from "./AdminFormComponents";
import { useToast } from "../../common/Toast";
import type { City, State } from "./adminTypes";
import styles from "./DataBuilder.module.css";

interface Country {
  id: number;
  country_name: string;
  continent: string | null;
}

interface ArtistRow {
  id: number;
  name: string;
  instagram_handle: string | null;
  city_name: string | null;
  state_name: string | null;
  country_name: string | null;
}

interface GenerateResult {
  output: string;
  totalCount: number;
  includedCount: number;
  brokenLinks: { name: string; handle: string }[];
}

interface Props {
  cities: City[];
  states: State[];
  countries: Country[];
  artists: ArtistRow[];
  brokenHandles: Set<string>;
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  options: { value: number; label: string }[];
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (value: number) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  const allFilteredSelected = filtered.length > 0 &&
    filtered.every(o => selected.has(o.value));

  const handleSelectAll = () => {
    const next = new Set(selected);
    for (const o of filtered) next.add(o.value);
    onChange(next);
  };

  const handleDeselectAll = () => {
    if (search.trim()) {
      // Only deselect filtered items
      const next = new Set(selected);
      for (const o of filtered) next.delete(o.value);
      onChange(next);
    } else {
      onChange(new Set());
    }
  };

  // Summary text for closed state
  const getSummary = (): string => {
    const total = options.length;
    const count = selected.size;
    if (count === 0 || count === total) {
      return `All ${label.toLowerCase()} (${total})`;
    }
    return `${count} of ${total} selected`;
  };

  return (
    <div className={styles.multiSelect} ref={ref}>
      <button
        type="button"
        className={`${styles.multiSelectTrigger} ${isOpen ? styles.multiSelectTriggerOpen : ""} ${disabled ? styles.multiSelectTriggerDisabled : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{getSummary()}</span>
        <span className={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={styles.multiSelectDropdown}>
          <input
            type="text"
            className={styles.multiSelectSearch}
            placeholder={placeholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />

          <div className={styles.multiSelectBulkActions}>
            {allFilteredSelected ? (
              <button type="button" onClick={handleDeselectAll}>
                Deselect all{search.trim() ? " shown" : ""}
              </button>
            ) : (
              <button type="button" onClick={handleSelectAll}>
                Select all{search.trim() ? " shown" : ""}
              </button>
            )}
          </div>

          <div className={styles.multiSelectList}>
            {filtered.length === 0 ? (
              <div className={styles.multiSelectEmpty}>No matches</div>
            ) : (
              filtered.map(o => (
                <label key={o.value} className={styles.multiSelectOption}>
                  <input
                    type="checkbox"
                    checked={selected.has(o.value)}
                    onChange={() => toggle(o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))
            )}
          </div>

          <div className={styles.multiSelectFooter}>
            <button
              type="button"
              className={styles.doneButton}
              onClick={() => {
                setIsOpen(false);
                setSearch("");
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataBuilder({ cities, states, countries, artists, brokenHandles }: Props) {
  const { showToast } = useToast();

  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedStateIds, setSelectedStateIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedCityIds, setSelectedCityIds] = useState<Set<number>>(
    new Set()
  );
  const [result, setResult] = useState<GenerateResult | null>(null);

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) =>
        a.country_name.localeCompare(b.country_name)
      ),
    [countries]
  );

  const filteredStates = useMemo(() => {
    if (!selectedCountryId) return [];
    const country = countries.find(
      c => c.id === parseInt(selectedCountryId)
    );
    if (!country) return [];
    return [...states]
      .filter(s => s.country_name === country.country_name)
      .sort((a, b) => a.state_name.localeCompare(b.state_name));
  }, [states, countries, selectedCountryId]);

  const filteredCities = useMemo(() => {
    if (!selectedCountryId) return [];
    if (selectedStateIds.size > 0) {
      return [...cities]
        .filter(c => c.state_id && selectedStateIds.has(c.state_id))
        .sort((a, b) => a.city_name.localeCompare(b.city_name));
    }
    const country = countries.find(
      c => c.id === parseInt(selectedCountryId)
    );
    if (!country) return [];
    return [...cities]
      .filter(c => c.country_name === country.country_name)
      .sort((a, b) => a.city_name.localeCompare(b.city_name));
  }, [cities, countries, selectedCountryId, selectedStateIds]);

  const stateOptions = useMemo(
    () =>
      filteredStates.map(s => ({
        value: s.id,
        label: s.state_name,
      })),
    [filteredStates]
  );

  const cityOptions = useMemo(
    () =>
      filteredCities.map(c => ({
        value: c.id,
        label: c.state_name
          ? `${c.city_name}, ${c.state_name}`
          : c.city_name,
      })),
    [filteredCities]
  );

  const hasNoSelection = !selectedCountryId;

  // When country changes, reset states and auto-select all cities
  const handleCountryChange = (value: string) => {
    setSelectedCountryId(value);
    setSelectedStateIds(new Set());

    if (value) {
      const country = countries.find(c => c.id === parseInt(value));
      if (country) {
        const countryCities = cities.filter(
          c => c.country_name === country.country_name
        );
        setSelectedCityIds(new Set(countryCities.map(c => c.id)));
      }
    } else {
      setSelectedCityIds(new Set());
    }
  };

  // When states change, auto-select all cities in selected states
  const handleStatesChange = (ids: Set<number>) => {
    setSelectedStateIds(ids);

    if (ids.size > 0) {
      const stateCities = cities.filter(
        c => c.state_id && ids.has(c.state_id)
      );
      setSelectedCityIds(new Set(stateCities.map(c => c.id)));
    } else if (selectedCountryId) {
      // Reset to all cities in country
      const country = countries.find(
        c => c.id === parseInt(selectedCountryId)
      );
      if (country) {
        const countryCities = cities.filter(
          c => c.country_name === country.country_name
        );
        setSelectedCityIds(new Set(countryCities.map(c => c.id)));
      }
    }
  };

  const buildHeading = (): string => {
    if (selectedCityIds.size === 1) {
      const cityId = [...selectedCityIds][0];
      const city = cities.find(c => c.id === cityId);
      if (city) {
        const parts = [city.city_name];
        if (city.state_name) parts.push(city.state_name);
        return `Traditional Tattoo Artists in ${parts.join(", ")}`;
      }
    }
    if (selectedCityIds.size > 1 && selectedCityIds.size < filteredCities.length) {
      return "Traditional Tattoo Artists — Multiple Cities";
    }
    if (selectedStateIds.size === 1) {
      const stateId = [...selectedStateIds][0];
      const state = states.find(s => s.id === stateId);
      if (state) return `Traditional Tattoo Artists in ${state.state_name}`;
    }
    if (selectedStateIds.size > 1) {
      return "Traditional Tattoo Artists — Multiple States";
    }
    if (selectedCountryId) {
      const country = countries.find(
        c => c.id === parseInt(selectedCountryId)
      );
      if (country)
        return `Traditional Tattoo Artists in ${country.country_name}`;
    }
    return "Traditional Tattoo Artists";
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter by selected cities (most specific level)
    let filtered = artists;

    if (selectedCityIds.size > 0) {
      const cityNames = new Set(
        cities
          .filter(c => selectedCityIds.has(c.id))
          .map(c => c.city_name)
      );
      filtered = artists.filter(
        a => a.city_name && cityNames.has(a.city_name)
      );
    } else if (selectedStateIds.size > 0) {
      const stateNames = new Set(
        states
          .filter(s => selectedStateIds.has(s.id))
          .map(s => s.state_name)
      );
      filtered = artists.filter(
        a => a.state_name && stateNames.has(a.state_name)
      );
    } else if (selectedCountryId) {
      const country = countries.find(
        c => c.id === parseInt(selectedCountryId)
      );
      if (country) {
        filtered = artists.filter(
          a => a.country_name === country.country_name
        );
      }
    }

    const totalCount = filtered.length;

    const broken: { name: string; handle: string }[] = [];
    const clean = filtered.filter(a => {
      if (!a.instagram_handle) return true;
      const normalized = a.instagram_handle.replace("@", "").toLowerCase();
      if (brokenHandles.has(normalized)) {
        broken.push({ name: a.name, handle: a.instagram_handle });
        return false;
      }
      return true;
    });

    clean.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    const heading = buildHeading();

    const formatArtistLine = (a: ArtistRow): string => {
      const handle = a.instagram_handle?.replace("@", "");
      if (handle) {
        return `- ${a.name} [@${handle}](https://instagram.com/${handle})`;
      }
      return `- ${a.name}`;
    };

    // Group by city when multiple cities are in the output
    const distinctCities = new Set(clean.map(a => a.city_name || "Unknown"));
    const shouldGroup = distinctCities.size > 1;

    let md: string;

    if (shouldGroup) {
      // Group artists by city, cities in A-Z order
      const byCity = new Map<string, ArtistRow[]>();
      for (const a of clean) {
        const key = a.city_name || "Unknown";
        if (!byCity.has(key)) byCity.set(key, []);
        byCity.get(key)!.push(a);
      }

      const sortedCityKeys = [...byCity.keys()].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );

      const sections = sortedCityKeys.map(cityName => {
        const cityArtists = byCity.get(cityName)!;
        const lines = cityArtists.map(formatArtistLine);
        return `**${cityName}**\n${lines.join("\n")}`;
      });

      md = `**${heading}**\n\n${sections.join("\n\n")}`;
    } else {
      const lines = clean.map(formatArtistLine);
      md = `**${heading}**\n\n${lines.join("\n")}`;
    }

    setResult({
      output: md,
      totalCount,
      includedCount: clean.length,
      brokenLinks: broken,
    });
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy");
    }
  };

  const handleClear = () => {
    setResult(null);
  };

  return (
    <div className={styles.container}>
      {/* Left column — filters */}
      <div className={styles.filterColumn}>
        <h2 className={styles.pageTitle}>Data Builder</h2>
        <form onSubmit={handleGenerate} className={styles.filterForm}>
          <div className={styles.filterFields}>
            <FormGroup>
              <Label htmlFor="db_country">Country</Label>
              <Select
                id="db_country"
                value={selectedCountryId}
                onChange={e => handleCountryChange(e.target.value)}
              >
                <option value="">Select a country</option>
                {sortedCountries.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.country_name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            {selectedCountryId && filteredStates.length > 0 && (
              <FormGroup>
                <Label htmlFor="db_state">States / Provinces</Label>
                <MultiSelect
                  label="states"
                  options={stateOptions}
                  selected={selectedStateIds}
                  onChange={handleStatesChange}
                  placeholder="Search states..."
                />
              </FormGroup>
            )}

            {selectedCountryId && (
              <FormGroup>
                <Label htmlFor="db_city">Cities</Label>
                <MultiSelect
                  label="cities"
                  options={cityOptions}
                  selected={selectedCityIds}
                  onChange={setSelectedCityIds}
                  placeholder="Search cities..."
                />
              </FormGroup>
            )}
          </div>

          <div className={styles.formActionsWrapper}>
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.generateButton}
                disabled={hasNoSelection}
              >
                Generate
              </button>
              <button
                type="button"
                className={styles.resetButton}
                disabled={hasNoSelection && !result}
                onClick={() => {
                  setSelectedCountryId("");
                  setSelectedStateIds(new Set());
                  setSelectedCityIds(new Set());
                  setResult(null);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Right column — output */}
      <div className={styles.outputColumn}>
        <div className={styles.outputHeader}>
          <span className={styles.outputLabel}>
            Output
            {result && (
              <> — {result.includedCount} artist
              {result.includedCount !== 1 ? "s" : ""}</>
            )}
          </span>
          {result && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleCopy}
              >
                Copy
              </button>
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {result ? (
          <>
            {result.brokenLinks.length > 0 && (
              <div className={styles.brokenLinksBanner}>
                <strong>
                  {result.brokenLinks.length} removed (broken IG link
                  {result.brokenLinks.length !== 1 ? "s" : ""})
                </strong>
                <ul className={styles.brokenLinksList}>
                  {result.brokenLinks.map((b, i) => (
                    <li key={i}>
                      {b.name}{" "}
                      <span className={styles.brokenHandle}>
                        @{b.handle.replace("@", "")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <pre className={styles.outputPre}>{result.output}</pre>
          </>
        ) : (
          <div className={styles.emptyState}>
            Select a location and click Generate to create an artist list.
          </div>
        )}
      </div>
    </div>
  );
}
