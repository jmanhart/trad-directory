import { useState, useEffect } from "react";
import { addShop, fetchCities } from "../../../services/adminApi";
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

  return (
    <AdminFormLayout title="Add Shop" loading={loadingData}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <FormGroup>
          <Label htmlFor="shop_name" required>Shop Name</Label>
          <Input
            type="text"
            id="shop_name"
            name="shop_name"
            value={formData.shop_name}
            onChange={handleChange}
            required
            placeholder="Shop name"
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
          <Label htmlFor="address">Address</Label>
          <Input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street address"
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
            placeholder="Email or other contact"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="Phone number"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            placeholder="https://example.com"
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

        {message && <Message type={message.type} text={message.text} />}

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Shop
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

