import { useState, useEffect } from "react";
import { addArtist, fetchCities, fetchShops } from "../../services/adminApi";
import styles from "./AdminAddArtist.module.css";

interface City {
  id: number;
  city_name: string;
  state_id: number | null;
  state_name: string | null;
  country_id: number | null;
  country_name: string | null;
}

interface Shop {
  id: number;
  shop_name: string;
}

export default function AdminAddArtist() {
  const [formData, setFormData] = useState({
    name: "",
    instagram_handle: "",
    city_id: "",
    shop_id: "",
  });
  const [cities, setCities] = useState<City[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
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
        const [citiesData, shopsData] = await Promise.all([
          fetchCities(),
          fetchShops(),
        ]);
        setCities(citiesData);
        setShops(shopsData);
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
      if (!formData.name || !formData.city_id) {
        setMessage({
          type: "error",
          text: "Please fill in all required fields",
        });
        setLoading(false);
        return;
      }

      const artistData = {
        name: formData.name,
        instagram_handle: formData.instagram_handle || undefined,
        city_id: parseInt(formData.city_id),
        shop_id: formData.shop_id ? parseInt(formData.shop_id) : undefined,
      };

      const artistId = await addArtist(artistData);
      setMessage({
        type: "success",
        text: `Artist "${formData.name}" added successfully! (ID: ${artistId})`,
      });

      // Reset form
      setFormData({
        name: "",
        instagram_handle: "",
        city_id: "",
        shop_id: "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add artist",
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
        <h1 className={styles.title}>Add Artist</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add Artist</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
            required
            placeholder="Artist name"
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

        <div className={styles.formGroup}>
          <label htmlFor="shop_id" className={styles.label}>
            Shop (optional)
          </label>
          <select
            id="shop_id"
            name="shop_id"
            value={formData.shop_id}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">No shop</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
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
          {loading ? "Adding..." : "Add Artist"}
        </button>
      </form>
    </div>
  );
}

