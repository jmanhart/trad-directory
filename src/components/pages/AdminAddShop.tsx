import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { addShop, fetchCities } from "../../services/adminApi";
import styles from "./AdminAddShop.module.css";

interface City {
  id: number;
  city_name: string;
  state_id: number | null;
  state_name: string | null;
  country_id: number | null;
  country_name: string | null;
}

export default function AdminAddShop() {
  const [formData, setFormData] = useState({
    shop_name: "",
    instagram_handle: "",
    address: "",
    contact: "",
    phone_number: "",
    website_url: "",
    city_id: "",
  });
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const citiesData = await fetchCities();
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate required fields
      if (!formData.shop_name || !formData.city_id) {
        setMessage({
          type: "error",
          text: "Please fill in all required fields",
        });
        setLoading(false);
        return;
      }

      const shopData = {
        shop_name: formData.shop_name,
        instagram_handle: formData.instagram_handle || undefined,
        address: formData.address || undefined,
        contact: formData.contact || undefined,
        phone_number: formData.phone_number || undefined,
        website_url: formData.website_url || undefined,
        city_id: parseInt(formData.city_id),
      };

      const shopId = await addShop(shopData);
      setMessage({
        type: "success",
        text: `Shop "${formData.shop_name}" added successfully! (ID: ${shopId})`,
      });

      // Reset form
      setFormData({
        shop_name: "",
        instagram_handle: "",
        address: "",
        contact: "",
        phone_number: "",
        website_url: "",
        city_id: "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add shop",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format city display name with state and country
  const getCityDisplayName = (city: City) => {
    const parts = [city.city_name];
    if (city.state_name) parts.push(city.state_name);
    if (city.country_name) parts.push(city.country_name);
    return parts.join(", ");
  };

  if (loadingData) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Add Shop</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/admin" className={styles.backLink}>← Back to Admin</Link>
      <h1 className={styles.title}>Add Shop</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="shop_name" className={styles.label}>
            Shop Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="shop_name"
            name="shop_name"
            value={formData.shop_name}
            onChange={handleChange}
            className={styles.input}
            required
            placeholder="Shop name"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="instagram_handle" className={styles.label}>
            Instagram Handle
          </label>
          <input
            type="text"
            id="instagram_handle"
            name="instagram_handle"
            value={formData.instagram_handle}
            onChange={handleChange}
            className={styles.input}
            placeholder="@username or username"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="address" className={styles.label}>
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={styles.input}
            placeholder="Street address"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contact" className={styles.label}>
            Contact
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className={styles.input}
            placeholder="Email or other contact"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone_number" className={styles.label}>
            Phone Number
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className={styles.input}
            placeholder="Phone number"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="website_url" className={styles.label}>
            Website URL
          </label>
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://example.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="city_id" className={styles.label}>
            City <span className={styles.required}>*</span>
          </label>
          <select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {getCityDisplayName(city)}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              message.type === "success" ? styles.success : styles.error
            }`}
          >
            {message.text}
          </div>
        )}

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Adding..." : "Add Shop"}
        </button>
      </form>
    </div>
  );
}

