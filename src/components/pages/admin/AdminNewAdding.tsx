import { useState, useEffect, useMemo, useRef } from "react";
import { addArtist, addCountry, addCity, fetchCountries } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import {
  FormGroup,
  Label,
  Input,
  Select,
  SubmitButton,
  Message,
  MessageWithRetry,
} from "./AdminFormComponents";
import { useAdminData } from "./useAdminData";
import { useDebounce } from "./useDebounce";
import { getCityDisplayName, getStateDisplayName } from "./adminUtils";
import { City } from "./adminTypes";
import styles from "./AdminForm.module.css";

interface NewAddingFormData {
  // City section (can be existing or new)
  city_id: string;
  city_search: string;
  new_city_name: string;
  new_city_state_id: string;
  new_city_country_id: string;
  new_city_country_name: string;
  new_city_country_code: string;
  add_new_country: boolean;

  // Artist section
  artist_name: string;
  artist_instagram_handle: string;
  artist_gender: string;
  artist_url: string;
  artist_contact: string;
  artist_shop_id: string;
  artist_is_traveling: boolean;
}

export default function AdminNewAdding() {
  const {
    cities,
    states,
    shops,
    loading: loadingData,
    error: dataError,
    refetch,
  } = useAdminData({
    loadCities: true,
    loadStates: true,
    loadShops: true,
  });

  const [countries, setCountries] = useState<{ id: number; country_name: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<NewAddingFormData>({
    city_id: "",
    city_search: "",
    new_city_name: "",
    new_city_state_id: "",
    new_city_country_id: "",
    new_city_country_name: "",
    new_city_country_code: "",
    add_new_country: false,
    artist_name: "",
    artist_instagram_handle: "",
    artist_gender: "",
    artist_url: "",
    artist_contact: "",
    artist_shop_id: "",
    artist_is_traveling: false,
  });

  // Load countries (non-blocking - form works without it)
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await fetchCountries();
        setCountries(countriesData);
        setCountriesError(null);
      } catch (error) {
        console.error("Failed to load countries:", error);
        setCountriesError("Failed to load countries list");
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Debounce city search for better performance
  const debouncedCitySearch = useDebounce(formData.city_search, 300);

  // Filter cities for autocomplete suggestions (only when typing)
  const citySuggestions = useMemo(() => {
    if (!debouncedCitySearch || debouncedCitySearch.length < 1) return [];
    const searchLower = debouncedCitySearch.toLowerCase();
    return cities
      .filter((city) => 
        city.city_name.toLowerCase().includes(searchLower) ||
        (city.state_name && city.state_name.toLowerCase().includes(searchLower)) ||
        (city.country_name && city.country_name.toLowerCase().includes(searchLower))
      )
      .slice(0, 10); // Limit to 10 suggestions
  }, [cities, debouncedCitySearch]);

  // Check if the typed city matches an existing city
  const exactCityMatch = useMemo(() => {
    if (!formData.city_search) return null;
    const searchLower = formData.city_search.toLowerCase().trim();
    return cities.find((city) => 
      city.city_name.toLowerCase() === searchLower ||
      getCityDisplayName(city).toLowerCase() === searchLower
    );
  }, [cities, formData.city_search]);

  const isAddingNewCity = formData.new_city_name !== "";

  // Filter states by selected country (for new city)
  // If states failed to load, return empty array (user can still add city without state)
  const filteredStates = useMemo(() => {
    if (states.length === 0) return [];
    if (!formData.new_city_country_id || formData.add_new_country) return states;
    const countryId = parseInt(formData.new_city_country_id);
    return states.filter((state) => state.country_id === countryId);
  }, [states, formData.new_city_country_id, formData.add_new_country]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Handle city search
    if (name === "city_search") {
      setShowCitySuggestions(value.length > 0);
      // If a city is selected from suggestions, clear the search
      if (formData.city_id) {
        setFormData((prev) => ({ ...prev, city_id: "" }));
      }
      // Clear new city fields when typing
      if (value) {
        setFormData((prev) => ({
          ...prev,
          new_city_name: "",
          new_city_state_id: "",
          new_city_country_id: "",
          new_city_country_name: "",
          new_city_country_code: "",
          add_new_country: false,
        }));
      }
    }

    // Clear dependent fields when parent changes
    if (name === "city_search" && !value) {
      setFormData((prev) => ({
        ...prev,
        city_id: "",
        new_city_name: "",
        new_city_state_id: "",
        new_city_country_id: "",
        new_city_country_name: "",
        new_city_country_code: "",
        add_new_country: false,
      }));
    }
    if (name === "new_city_country_id" || name === "add_new_country") {
      setFormData((prev) => ({
        ...prev,
        new_city_state_id: "",
      }));
    }
  };

  const handleCitySuggestionClick = (city: City) => {
    setFormData((prev) => ({
      ...prev,
      city_id: city.id.toString(),
      city_search: getCityDisplayName(city),
      new_city_name: "",
      new_city_state_id: "",
      new_city_country_id: "",
      new_city_country_name: "",
      new_city_country_code: "",
      add_new_country: false,
    }));
    setShowCitySuggestions(false);
  };

  const handleAddNewCityClick = () => {
    setFormData((prev) => ({
      ...prev,
      new_city_name: prev.city_search,
    }));
    setShowCitySuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let cityId: number | undefined;
      let cityName: string | undefined;
      let stateId: number | undefined;
      let stateName: string | undefined;
      let countryId: number | undefined;
      let countryName: string | undefined;

      // Step 1: Add country if new (for new city)
      if (isAddingNewCity && formData.add_new_country && formData.new_city_country_name) {
        const newCountryId = await addCountry({
          country_name: formData.new_city_country_name,
          country_code: formData.new_city_country_code || undefined,
        });
        countryId = newCountryId;
        countryName = formData.new_city_country_name;
        // Refresh countries list
        const countriesData = await fetchCountries();
        setCountries(countriesData);
      } else if (isAddingNewCity && formData.new_city_country_id) {
        countryId = parseInt(formData.new_city_country_id);
        const country = countries.find((c) => c.id === countryId);
        countryName = country?.country_name;
      }

      // Step 2: Get state info if selected (for new city)
      if (isAddingNewCity && formData.new_city_state_id) {
        stateId = parseInt(formData.new_city_state_id);
        const state = states.find((s) => s.id === stateId);
        stateName = state?.state_name;
      }

      // Step 3: Add city if new or use existing
      if (isAddingNewCity) {
        const cityNameToAdd = formData.new_city_name.trim();
        if (!cityNameToAdd) {
          throw new Error("City name is required");
        }
        const newCityId = await addCity({
          city_name: cityNameToAdd,
          state_id: stateId || null,
        });
        cityId = newCityId;
        cityName = cityNameToAdd;
        // Refresh cities list
        await refetch();
      } else if (formData.city_id) {
        cityId = parseInt(formData.city_id);
        const city = cities.find((c) => c.id === cityId);
        cityName = city?.city_name;
        stateName = city?.state_name || undefined;
        countryName = city?.country_name || undefined;
      } else {
        throw new Error("Please select a city or add a new one");
      }

      // Step 4: Add artist (required)
      if (!formData.artist_name) {
        throw new Error("Artist name is required");
      }

      if (!cityId && !cityName) {
        throw new Error("City is required");
      }

      const artistId = await addArtist({
        name: formData.artist_name,
        instagram_handle: formData.artist_instagram_handle || undefined,
        gender: formData.artist_gender || undefined,
        url: formData.artist_url || undefined,
        contact: formData.artist_contact || undefined,
        city_id: cityId,
        city_name: cityName,
        state_name: stateName,
        country_name: countryName,
        shop_id: formData.artist_shop_id ? parseInt(formData.artist_shop_id) : undefined,
        is_traveling: formData.artist_is_traveling || undefined,
      });

      // Refresh all data
      await refetch();

      setMessage({
        type: "success",
        text: `Successfully added artist "${formData.artist_name}"${cityName ? ` in ${cityName}` : ""}${countryName ? `, ${countryName}` : ""}! (ID: ${artistId})`,
      });

      // Reset form
      setFormData({
        city_id: "",
        city_search: "",
        new_city_name: "",
        new_city_state_id: "",
        new_city_country_id: "",
        new_city_country_name: "",
        new_city_country_code: "",
        add_new_country: false,
        artist_name: "",
        artist_instagram_handle: "",
        artist_gender: "",
        artist_url: "",
        artist_contact: "",
        artist_shop_id: "",
        artist_is_traveling: false,
      });
      setShowCitySuggestions(false);

      // Auto-dismiss success message
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to add items. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayMessage = dataError || message;

  // Don't block form loading if data fails - allow manual entry
  const isLoading = loadingData && !dataError;

  return (
    <AdminFormLayout
      title="New Adding"
      loading={isLoading}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {displayMessage && dataError ? (
          <MessageWithRetry
            type={displayMessage.type}
            text={displayMessage.text}
            onRetry={refetch}
            retryLoading={loadingData}
          />
        ) : displayMessage ? (
          <Message type={displayMessage.type} text={displayMessage.text} />
        ) : null}
        
        {(dataError || countriesError) && (
          <div style={{ 
            padding: "1rem", 
            backgroundColor: "rgba(255, 193, 7, 0.1)", 
            border: "1px solid rgba(255, 193, 7, 0.3)", 
            borderRadius: "8px",
            marginBottom: "1rem"
          }}>
            <div style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>
              <strong>⚠️ Some data failed to load.</strong> You can still add everything manually:
              <ul style={{ margin: "0.5rem 0 0 1.5rem", padding: 0 }}>
                {dataError && <li>Type a city name and click "Add new City?" to add it</li>}
                {countriesError && <li>Check "Add new country" to add a country</li>}
              </ul>
            </div>
          </div>
        )}

        {/* City Section */}
        <FormGroup>
          <Label htmlFor="city_search" required>
            City
          </Label>
          <div className={styles.autocompleteWrapper}>
            <Input
              ref={cityInputRef}
              type="text"
              id="city_search"
              name="city_search"
              value={formData.city_search}
              onChange={handleChange}
              onFocus={() => {
                if (formData.city_search && formData.city_search.length > 0) {
                  setShowCitySuggestions(true);
                }
              }}
              required
              placeholder="Search for a city"
              autoComplete="off"
            />
            {showCitySuggestions && (
              <div ref={suggestionsRef} className={styles.suggestions}>
                {citySuggestions.length > 0 ? (
                  <>
                    {citySuggestions.map((city) => (
                      <div
                        key={city.id}
                        className={styles.suggestionItem}
                        onClick={() => handleCitySuggestionClick(city)}
                      >
                        {getCityDisplayName(city)}
                      </div>
                    ))}
                  </>
                ) : null}
                {formData.city_search && formData.city_search.length > 0 && (
                  <div
                    className={styles.suggestionItem}
                    onClick={handleAddNewCityClick}
                    style={{ fontWeight: 500, color: "var(--color-primary)", borderTop: citySuggestions.length > 0 ? "1px solid var(--color-border)" : "none" }}
                  >
                    ➕ Add new City?
                  </div>
                )}
              </div>
            )}
          </div>
        </FormGroup>

        {/* New City Fields (shown when typing a city that doesn't exist) */}
        {isAddingNewCity && (
          <div style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "8px", backgroundColor: "var(--color-surface)", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Add New City: {formData.city_search}
            </h3>

            <FormGroup>
              <Label htmlFor="new_city_name">
                City Name (edit if needed)
              </Label>
              <Input
                type="text"
                id="new_city_name"
                name="new_city_name"
                value={formData.new_city_name || formData.city_search}
                onChange={handleChange}
                placeholder="City name"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="new_city_state_id">State/Province (optional)</Label>
              <Select
                id="new_city_state_id"
                name="new_city_state_id"
                value={formData.new_city_state_id}
                onChange={handleChange}
              >
                <option value="">No state/province</option>
                {filteredStates.map((state) => (
                  <option key={state.id} value={state.id}>
                    {getStateDisplayName(state)}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Input
                  type="checkbox"
                  id="add_new_country"
                  name="add_new_country"
                  checked={formData.add_new_country}
                  onChange={handleChange}
                />
                <Label htmlFor="add_new_country" style={{ margin: 0, cursor: "pointer" }}>
                  Add new country
                </Label>
              </div>
            </FormGroup>

            {formData.add_new_country ? (
              <>
                <FormGroup>
                  <Label htmlFor="new_city_country_name" required>
                    Country Name
                  </Label>
                  <Input
                    type="text"
                    id="new_city_country_name"
                    name="new_city_country_name"
                    value={formData.new_city_country_name}
                    onChange={handleChange}
                    required={formData.add_new_country}
                    placeholder="Country name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="new_city_country_code">Country Code</Label>
                  <Input
                    type="text"
                    id="new_city_country_code"
                    name="new_city_country_code"
                    value={formData.new_city_country_code}
                    onChange={handleChange}
                    placeholder="e.g., US, CA, GB"
                    maxLength={3}
                  />
                </FormGroup>
              </>
            ) : (
              <FormGroup>
                <Label htmlFor="new_city_country_id">Country (optional)</Label>
                <Select
                  id="new_city_country_id"
                  name="new_city_country_id"
                  value={formData.new_city_country_id}
                  onChange={handleChange}
                  disabled={loadingCountries}
                >
                  <option value="">No country selected</option>
                  {countries.length === 0 && !loadingCountries && (
                    <option value="" disabled>Countries list unavailable - use "Add new country" checkbox</option>
                  )}
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.country_name}
                    </option>
                  ))}
                </Select>
                {countriesError && (
                  <p className={styles.helperText} style={{ marginTop: "0.5rem", color: "var(--color-text-tertiary)" }}>
                    Countries list unavailable. Check "Add new country" to add one.
                  </p>
                )}
              </FormGroup>
            )}
          </div>
        )}

        {/* Artist Section */}
        <FormGroup>
          <Label htmlFor="artist_name" required>
            Artist Name
          </Label>
          <Input
            type="text"
            id="artist_name"
            name="artist_name"
            value={formData.artist_name}
            onChange={handleChange}
            required
            placeholder="Artist name"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="artist_instagram_handle">Instagram Handle</Label>
          <Input
            type="text"
            id="artist_instagram_handle"
            name="artist_instagram_handle"
            value={formData.artist_instagram_handle}
            onChange={handleChange}
            placeholder="@username or username"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="artist_gender">Gender</Label>
          <Input
            type="text"
            id="artist_gender"
            name="artist_gender"
            value={formData.artist_gender}
            onChange={handleChange}
            placeholder="Gender"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="artist_url">URL</Label>
          <Input
            type="url"
            id="artist_url"
            name="artist_url"
            value={formData.artist_url}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="artist_contact">Contact</Label>
          <Input
            type="text"
            id="artist_contact"
            name="artist_contact"
            value={formData.artist_contact}
            onChange={handleChange}
            placeholder="Email or phone number"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="artist_shop_id">Shop (optional)</Label>
          <Select
            id="artist_shop_id"
            name="artist_shop_id"
            value={formData.artist_shop_id}
            onChange={handleChange}
          >
            <option value="">No shop</option>
            {shops.length === 0 && dataError && (
              <option value="" disabled>Shops list unavailable</option>
            )}
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Input
              type="checkbox"
              id="artist_is_traveling"
              name="artist_is_traveling"
              checked={formData.artist_is_traveling}
              onChange={handleChange}
            />
            <Label htmlFor="artist_is_traveling" style={{ margin: 0, cursor: "pointer" }}>
              Traveling Artist
            </Label>
          </div>
        </FormGroup>

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Artist
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}
