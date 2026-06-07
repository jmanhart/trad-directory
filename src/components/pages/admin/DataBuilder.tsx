import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FormGroup, Label, Select, SubmitButton } from "./AdminFormComponents";
import { fetchBrokenLinks } from "../../../services/adminApi";
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
}

function MultiSelect({
  id,
  options,
  selected,
  onChange,
  placeholder,
}: {
  id: string;
  options: { value: number; label: string }[];
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");

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

  const selectedOptions = options.filter(o => selected.has(o.value));

  return (
    <div className={styles.multiSelect}>
      {selectedOptions.length > 0 && (
        <div className={styles.selectedTags}>
          {selectedOptions.map(o => (
            <span key={o.value} className={styles.tag}>
              {o.label}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => toggle(o.value)}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className={styles.clearAll}
            onClick={() => onChange(new Set())}
          >
            Clear all
          </button>
        </div>
      )}
      <input
        id={id}
        type="text"
        className={styles.multiSelectSearch}
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
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
    </div>
  );
}

export default function DataBuilder({ cities, states, countries }: Props) {
  const { showToast } = useToast();

  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedStateIds, setSelectedStateIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedCityIds, setSelectedCityIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) =>
        a.country_name.localeCompare(b.country_name)
      ),
    [countries]
  );

  const filteredStates = useMemo(() => {
    let list = states;
    if (selectedCountryId) {
      const country = countries.find(
        c => c.id === parseInt(selectedCountryId)
      );
      if (country) {
        list = states.filter(s => s.country_name === country.country_name);
      }
    }
    return [...list].sort((a, b) =>
      a.state_name.localeCompare(b.state_name)
    );
  }, [states, countries, selectedCountryId]);

  const filteredCities = useMemo(() => {
    let list = cities;
    if (selectedStateIds.size > 0) {
      list = cities.filter(
        c => c.state_id && selectedStateIds.has(c.state_id)
      );
    } else if (selectedCountryId) {
      const country = countries.find(
        c => c.id === parseInt(selectedCountryId)
      );
      if (country) {
        list = cities.filter(c => c.country_name === country.country_name);
      }
    }
    return [...list].sort((a, b) =>
      a.city_name.localeCompare(b.city_name)
    );
  }, [cities, countries, selectedCountryId, selectedStateIds]);

  const stateOptions = useMemo(
    () =>
      filteredStates.map(s => ({
        value: s.id,
        label: s.country_name
          ? `${s.state_name} (${s.country_name})`
          : s.state_name,
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

  const hasNoSelection =
    !selectedCountryId &&
    selectedStateIds.size === 0 &&
    selectedCityIds.size === 0;

  const handleCountryChange = (value: string) => {
    setSelectedCountryId(value);
    setSelectedStateIds(new Set());
    setSelectedCityIds(new Set());
  };

  const handleStatesChange = (ids: Set<number>) => {
    setSelectedStateIds(ids);
    setSelectedCityIds(new Set());
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
    if (selectedCityIds.size > 1) {
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Fetch artists and broken links in parallel
      const baseUrl = import.meta.env.VITE_API_URL || "/api";
      const [artistRes, brokenLinkResults] = await Promise.all([
        fetch(`${baseUrl}/listAllArtists`),
        fetchBrokenLinks().catch(() => []),
      ]);

      if (!artistRes.ok) throw new Error("Failed to fetch artists");
      const data = await artistRes.json();
      const allArtists: ArtistRow[] = data.artists || [];

      // Build set of broken handles for fast lookup
      const brokenHandles = new Set(
        brokenLinkResults.map(b =>
          b.instagram_handle.replace("@", "").toLowerCase()
        )
      );

      // Filter by selected geo level
      let filtered = allArtists;

      if (selectedCityIds.size > 0) {
        const cityNames = new Set(
          cities
            .filter(c => selectedCityIds.has(c.id))
            .map(c => c.city_name)
        );
        filtered = allArtists.filter(
          a => a.city_name && cityNames.has(a.city_name)
        );
      } else if (selectedStateIds.size > 0) {
        const stateNames = new Set(
          states
            .filter(s => selectedStateIds.has(s.id))
            .map(s => s.state_name)
        );
        filtered = allArtists.filter(
          a => a.state_name && stateNames.has(a.state_name)
        );
      } else if (selectedCountryId) {
        const country = countries.find(
          c => c.id === parseInt(selectedCountryId)
        );
        if (country) {
          filtered = allArtists.filter(
            a => a.country_name === country.country_name
          );
        }
      }

      const totalCount = filtered.length;

      // Separate broken from clean
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

      // Sort alphabetically
      clean.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

      // Build markdown
      const heading = buildHeading();
      const lines = clean.map(a => {
        const handle = a.instagram_handle?.replace("@", "");
        if (handle) {
          return `- ${a.name} [@${handle}](https://instagram.com/${handle})`;
        }
        return `- ${a.name}`;
      });

      const md = `**${heading}**\n\n${lines.join("\n")}`;

      setResult({
        output: md,
        totalCount,
        includedCount: clean.length,
        brokenLinks: broken,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to generate list"
      );
    } finally {
      setLoading(false);
    }
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
        <Link to="/admin" className={styles.backLink}>
          ← Back to Admin
        </Link>
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
                <option value="">All countries</option>
                {sortedCountries.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.country_name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="db_state">
                States{" "}
                {selectedStateIds.size > 0 && (
                  <span className={styles.filterCount}>
                    ({selectedStateIds.size})
                  </span>
                )}
              </Label>
              <MultiSelect
                id="db_state"
                options={stateOptions}
                selected={selectedStateIds}
                onChange={handleStatesChange}
                placeholder="Search states..."
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="db_city">
                Cities{" "}
                {selectedCityIds.size > 0 && (
                  <span className={styles.filterCount}>
                    ({selectedCityIds.size})
                  </span>
                )}
              </Label>
              <MultiSelect
                id="db_city"
                options={cityOptions}
                selected={selectedCityIds}
                onChange={setSelectedCityIds}
                placeholder="Search cities..."
              />
            </FormGroup>
          </div>

          <div className={styles.formActions}>
            <SubmitButton
              loading={loading}
              loadingText="Generating..."
              type="submit"
              disabled={hasNoSelection}
            >
              Generate
            </SubmitButton>
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
        </form>
      </div>

      {/* Right column — output */}
      <div className={styles.outputColumn}>
        <div className={styles.outputHeader}>
          <h3 className={styles.columnTitle} style={{ marginBottom: 0 }}>
            Output
          </h3>
          {result && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <span className={styles.artistCount}>
                {result.includedCount} artist
                {result.includedCount !== 1 ? "s" : ""}
              </span>
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
