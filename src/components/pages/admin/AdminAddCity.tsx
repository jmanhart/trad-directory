import { useState, useEffect, useMemo, useRef } from "react";
import { addCity, fetchStates, fetchCities } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import { FormGroup, Label, Input, Select, SubmitButton, Message } from "./AdminFormComponents";
import styles from "./AdminForm.module.css";

interface State {
  id: number;
  state_name: string;
  country_id: number | null;
  country_name: string | null;
}

interface City {
  id: number;
  city_name: string;
  state_id: number | null;
  state_name: string | null;
  country_id: number | null;
  country_name: string | null;
}

export default function AdminAddCity() {
  const [formData, setFormData] = useState({
    city_name: "",
    state_id: "",
  });
  const [citySearch, setCitySearch] = useState("");
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [statesData, citiesData] = await Promise.all([
          fetchStates(),
          fetchCities(),
        ]);
        setStates(statesData);
        setCities(citiesData);
      } catch (error) {
        setMessage({
          type: "error",
          text: `Failed to load data: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Update search when city name changes
    if (name === "city_name") {
      setCitySearch(value);
      setShowSuggestions(value.length >= 2);
    }
  };

  const handleSuggestionClick = (city: City) => {
    setFormData((prev) => ({
      ...prev,
      city_name: city.city_name,
      state_id: city.state_id ? city.state_id.toString() : "",
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate required fields
      if (!formData.city_name) {
        setMessage({
          type: "error",
          text: "Please enter a city name",
        });
        setLoading(false);
        return;
      }

      const cityData = {
        city_name: formData.city_name,
        state_id: formData.state_id ? parseInt(formData.state_id) : null,
      };

      const cityId = await addCity(cityData);
      setMessage({
        type: "success",
        text: `City "${formData.city_name}" added successfully! (ID: ${cityId})`,
      });

      // Reset form
      setFormData({
        city_name: "",
        state_id: "",
      });
      setCitySearch("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add city",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format state display name with country
  const getStateDisplayName = (state: State) => {
    if (state.country_name) {
      return `${state.state_name}, ${state.country_name}`;
    }
    return state.state_name;
  };

  // Format city display name with state and country
  const getCityDisplayName = (city: City) => {
    const parts = [city.city_name];
    if (city.state_name) parts.push(city.state_name);
    if (city.country_name) parts.push(city.country_name);
    return parts.join(", ");
  };

  // Filter cities for autocomplete suggestions
  const citySuggestions = useMemo(() => {
    if (!citySearch || citySearch.length < 2) return [];
    const searchLower = citySearch.toLowerCase();
    return cities
      .filter((city) => city.city_name.toLowerCase().includes(searchLower))
      .slice(0, 10); // Limit to 10 suggestions
  }, [cities, citySearch]);

  // Check if exact city name already exists (case-insensitive)
  const exactCityMatch = cities.find(
    (city) =>
      city.city_name.toLowerCase() === formData.city_name.toLowerCase() &&
      (!formData.state_id || !city.state_id || city.state_id === parseInt(formData.state_id))
  );

  return (
    <AdminFormLayout title="Add City" loading={loadingData}>
      <form onSubmit={handleSubmit} className={styles.form}>
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
              onFocus={() => setShowSuggestions(citySearch.length >= 2)}
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

        {message && <Message type={message.type} text={message.text} />}

        <SubmitButton loading={loading} loadingText="Adding...">
          Add City
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

