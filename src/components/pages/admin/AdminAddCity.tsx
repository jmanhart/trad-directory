import { useState, useEffect, useMemo, useRef } from "react";
import { addCity, fetchCountries } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import { FormGroup, Label, Input, Select, SubmitButton, Message } from "./AdminFormComponents";
import { useAdminData } from "./useAdminData";
import { useAdminForm } from "./useAdminForm";
import { useDebounce } from "./useDebounce";
import { getCityDisplayName, getStateDisplayName } from "./adminUtils";
import { City } from "./adminTypes";
import styles from "./AdminForm.module.css";

interface CityFormData {
  city_name: string;
  country_id: string;
  state_id: string;
}

export default function AdminAddCity() {
  const { states, cities, loading: loadingData, error: dataError, refetch } = useAdminData({
    loadStates: true,
    loadCities: true,
  });

  const [countries, setCountries] = useState<{ id: number; country_name: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [citySearch, setCitySearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search input for better performance
  const debouncedCitySearch = useDebounce(citySearch, 300);

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await fetchCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error("Failed to load countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  const {
    formData,
    setFormData,
    loading,
    message,
    handleChange: baseHandleChange,
    handleSubmit: baseHandleSubmit,
  } = useAdminForm<CityFormData, any>({
    initialData: {
      city_name: "",
      country_id: "",
      state_id: "",
    },
    onSubmit: async (data) => {
      return await addCity(data);
    },
    transformData: (formData) => ({
      city_name: formData.city_name,
      state_id: formData.state_id ? parseInt(formData.state_id) : null,
      // Note: country_id is not stored directly on cities, only through states
      // We keep it for filtering states, but don't send it to the API
    }),
    validateData: (formData) => {
      if (!formData.city_name) {
        return "Please enter a city name";
      }
      return null;
    },
    getSuccessMessage: (formData, cityId) =>
      `City "${formData.city_name}" added successfully! (ID: ${cityId})`,
    onSuccess: async () => {
      setCitySearch("");
      // Refresh cities list to include the new city
      await refetch();
    },
    autoDismissSuccess: true,
  });

  // Override handleChange to also update search
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    baseHandleChange(e);
    // Update search when city name changes
    if (e.target.name === "city_name") {
      setCitySearch(e.target.value);
      setShowSuggestions(e.target.value.length >= 2);
    }
  };

  const handleSuggestionClick = (city: City) => {
    setFormData({
      city_name: city.city_name,
      country_id: city.country_id ? city.country_id.toString() : "",
      state_id: city.state_id ? city.state_id.toString() : "",
    });
    setCitySearch(city.city_name);
    setShowSuggestions(false);
  };

  // Filter states by selected country
  const filteredStates = useMemo(() => {
    if (!formData.country_id) return states;
    const countryId = parseInt(formData.country_id);
    return states.filter(state => state.country_id === countryId);
  }, [states, formData.country_id]);

  // When country changes, clear state selection if it's not in the filtered list
  useEffect(() => {
    if (formData.country_id && formData.state_id) {
      const stateId = parseInt(formData.state_id);
      const stateExists = filteredStates.some(state => state.id === stateId);
      if (!stateExists) {
        setFormData(prev => ({ ...prev, state_id: "" }));
      }
    }
  }, [formData.country_id, filteredStates]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Use data loading error if present, otherwise use form message
  const displayMessage = dataError || message;

  // Filter cities for autocomplete suggestions (using debounced search)
  const citySuggestions = useMemo(() => {
    if (!debouncedCitySearch || debouncedCitySearch.length < 2) return [];
    const searchLower = debouncedCitySearch.toLowerCase();
    return cities
      .filter((city) => city.city_name.toLowerCase().includes(searchLower))
      .slice(0, 10); // Limit to 10 suggestions
  }, [cities, debouncedCitySearch]);

  // Check if exact city name already exists (case-insensitive)
  // Match by city name and optionally by state_id or country_id
  const exactCityMatch = cities.find(
    (city) => {
      const nameMatches = city.city_name.toLowerCase() === formData.city_name.toLowerCase();
      if (!nameMatches) return false;
      
      // If state is selected, match by state_id
      if (formData.state_id) {
        return city.state_id === parseInt(formData.state_id);
      }
      
      // If country is selected but no state, match by country_id and no state
      if (formData.country_id && !formData.state_id) {
        return !city.state_id && city.country_id === parseInt(formData.country_id);
      }
      
      // If neither state nor country selected, match cities with no state
      return !city.state_id;
    }
  );

  return (
    <AdminFormLayout title="Add City" loading={loadingData || loadingCountries}>
      <form onSubmit={baseHandleSubmit} className={styles.form}>
        {displayMessage && <Message type={displayMessage.type} text={displayMessage.text} />}
        <FormGroup>
          <Label htmlFor="city_name" required>City Name</Label>
          <div className={styles.autocompleteWrapper}>
            <Input
              ref={cityInputRef}
              type="text"
              id="city_name"
              name="city_name"
              value={formData.city_name}
              onChange={handleChange}
              onFocus={() => setShowSuggestions(debouncedCitySearch.length >= 2)}
              required
              placeholder="Type city name"
              autoComplete="off"
            />
            {showSuggestions && citySuggestions.length > 0 && (
              <div ref={suggestionsRef} className={styles.suggestions}>
                <div className={styles.suggestionsHeader}>
                  Existing cities (to avoid duplicates):
                </div>
                {citySuggestions.map((city) => (
                  <div
                    key={city.id}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(city)}
                  >
                    {getCityDisplayName(city)}
                  </div>
                ))}
              </div>
            )}
          </div>
          {formData.city_name && exactCityMatch && (
            <p className={styles.warningText}>
              ⚠️ A city with this name already exists: {getCityDisplayName(exactCityMatch)}
            </p>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="country_id">Country</Label>
          <Select
            id="country_id"
            name="country_id"
            value={formData.country_id}
            onChange={handleChange}
            disabled={loadingCountries}
          >
            <option value="">Select a country (optional)</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.country_name}
              </option>
            ))}
          </Select>
          <p className={styles.helperText}>
            Select a country to filter states, or leave blank
          </p>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="state_id">State/Province (optional)</Label>
          <Select
            id="state_id"
            name="state_id"
            value={formData.state_id}
            onChange={handleChange}
            disabled={formData.country_id && filteredStates.length === 0}
          >
            <option value="">No state/province</option>
            {filteredStates.map((state) => (
              <option key={state.id} value={state.id}>
                {getStateDisplayName(state)}
              </option>
            ))}
          </Select>
          <p className={styles.helperText}>
            {formData.country_id
              ? filteredStates.length === 0
                ? "No states found for this country. You can still add the city without a state."
                : "Leave blank for countries without states or cities without state information"
              : "Select a country first to filter states, or leave blank to add city without state"}
          </p>
        </FormGroup>

        <SubmitButton loading={loading} loadingText="Adding...">
          Add City
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

