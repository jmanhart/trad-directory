import { useState, useEffect } from "react";
import { addArtist, fetchCities, fetchShops } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import { FormGroup, Label, Input, Select, SubmitButton, Message } from "./AdminFormComponents";
import styles from "./AdminForm.module.css";

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
    gender: "",
    url: "",
    contact: "",
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
        gender: formData.gender || undefined,
        url: formData.url || undefined,
        contact: formData.contact || undefined,
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
        gender: "",
        url: "",
        contact: "",
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

  return (
    <AdminFormLayout title="Add Artist" loading={loadingData}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <FormGroup>
          <Label htmlFor="name" required>Name</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Artist name"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="instagram_handle">Instagram Handle</Label>
          <Input
            type="text"
            id="instagram_handle"
            name="instagram_handle"
            value={formData.instagram_handle}
            onChange={handleChange}
            placeholder="@username or username"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="gender">Gender</Label>
          <Input
            type="text"
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            placeholder="Gender"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="url">URL</Label>
          <Input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="contact">Contact</Label>
          <Input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Email or phone number"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="city_id" required>City</Label>
          <Select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {getCityDisplayName(city)}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="shop_id">Shop (optional)</Label>
          <Select
            id="shop_id"
            name="shop_id"
            value={formData.shop_id}
            onChange={handleChange}
          >
            <option value="">No shop</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
              </option>
            ))}
          </Select>
        </FormGroup>

        {message && <Message type={message.type} text={message.text} />}

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Artist
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

