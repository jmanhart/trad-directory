import { addShop } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import { FormGroup, Label, Input, Select, SubmitButton, Message } from "./AdminFormComponents";
import { useAdminData } from "./useAdminData";
import { useAdminForm } from "./useAdminForm";
import { getCityDisplayName } from "./adminUtils";
import styles from "./AdminForm.module.css";

interface ShopFormData {
  shop_name: string;
  instagram_handle: string;
  address: string;
  contact: string;
  phone_number: string;
  website_url: string;
  city_id: string;
}

export default function AdminAddShop() {
  const { cities, loading: loadingData, error: dataError } = useAdminData({
    loadCities: true,
  });

  const {
    formData,
    loading,
    message,
    handleChange,
    handleSubmit,
  } = useAdminForm<ShopFormData, any>({
    initialData: {
      shop_name: "",
      instagram_handle: "",
      address: "",
      contact: "",
      phone_number: "",
      website_url: "",
      city_id: "",
    },
    onSubmit: async (data) => {
      return await addShop(data);
    },
    transformData: (formData) => ({
      shop_name: formData.shop_name,
      instagram_handle: formData.instagram_handle || undefined,
      address: formData.address || undefined,
      contact: formData.contact || undefined,
      phone_number: formData.phone_number || undefined,
      website_url: formData.website_url || undefined,
      city_id: parseInt(formData.city_id),
    }),
    validateData: (formData) => {
      if (!formData.shop_name || !formData.city_id) {
        return "Please fill in all required fields";
      }
      return null;
    },
    getSuccessMessage: (formData, shopId) =>
      `Shop "${formData.shop_name}" added successfully! (ID: ${shopId})`,
  });

  // Use data loading error if present, otherwise use form message
  const displayMessage = dataError || message;

  return (
    <AdminFormLayout title="Add Shop" loading={loadingData}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {displayMessage && <Message type={displayMessage.type} text={displayMessage.text} />}
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

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Shop
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}

