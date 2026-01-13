import { useState, useEffect, useMemo, useRef } from "react";
import { addCity } from "../../../services/adminApi";
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
  state_id: string;
}

export default function AdminAddCity() {
  const { states, cities, loading: loadingData, error: dataError, refetch } = useAdminData({
    loadStates: true,
    loadCities: true,
  });

  const [citySearch, setCitySearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search input for better performance
  const debouncedCitySearch = useDebounce(citySearch, 300);

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
      state_id: "",
    },
    onSubmit: async (data) => {
      return await addCity(data);
    },
    transformData: (formData) => ({
      city_name: formData.city_name,
      state_id: formData.state_id ? parseInt(formData.state_id) : null,
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
      state_id: city.state_id ? city.state_id.toString() : "",
    });
    setCitySearch(city.city_name);
    setShowSuggestions(false);
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
  const exactCityMatch = cities.find(
    (city) =>
      city.city_name.toLowerCase() === formData.city_name.toLowerCase() &&
      (!formData.state_id || !city.state_id || city.state_id === parseInt(formData.state_id))
  );

  return (
    <AdminFormLayout title="Add City" loading={loadingData}>
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
          <Label htmlFor="state_id">State/Province (optional)</Label>
          <Select
            id="state_id"
            name="state_id"
            value={formData.state_id}
            onChange={handleChange}
          >
            <option value="">No state/province</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {getStateDisplayName(state)}
              </option>
            ))}
          </Select>
          <p className={styles.helperText}>
            Leave blank for countries without states (e.g., China)
          </p>
        </FormGroup>

        <SubmitButton loading={loading} loadingText="Adding...">
          Add City
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

