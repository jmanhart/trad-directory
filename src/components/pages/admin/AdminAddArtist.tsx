import { addArtist } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import {
  FormGroup,
  Label,
  Input,
  Select,
  SubmitButton,
  Message,
} from "./AdminFormComponents";
import { useAdminData } from "./useAdminData";
import { useAdminForm } from "./useAdminForm";
import { getCityDisplayName } from "./adminUtils";
import styles from "./AdminForm.module.css";

interface ArtistFormData {
  name: string;
  instagram_handle: string;
  gender: string;
  url: string;
  contact: string;
  city_id: string;
  shop_id: string;
}

export default function AdminAddArtist() {
  const {
    cities,
    shops,
    loading: loadingData,
    error: dataError,
  } = useAdminData({
    loadCities: true,
    loadShops: true,
  });

  const { formData, loading, message, handleChange, handleSubmit } =
    useAdminForm<ArtistFormData, any>({
      initialData: {
        name: "",
        instagram_handle: "",
        gender: "",
        url: "",
        contact: "",
        city_id: "",
        shop_id: "",
      },
      onSubmit: async data => {
        return await addArtist(data);
      },
      transformData: formData => ({
        name: formData.name,
        instagram_handle: formData.instagram_handle || undefined,
        gender: formData.gender || undefined,
        url: formData.url || undefined,
        contact: formData.contact || undefined,
        city_id: parseInt(formData.city_id),
        shop_id: formData.shop_id ? parseInt(formData.shop_id) : undefined,
      }),
      validateData: formData => {
        if (!formData.name || !formData.city_id) {
          return "Please fill in all required fields";
        }
        return null;
      },
      getSuccessMessage: (formData, artistId) =>
        `Artist "${formData.name}" added successfully! (ID: ${artistId})`,
    });

  // Use data loading error if present, otherwise use form message
  const displayMessage = dataError || message;

  return (
    <AdminFormLayout title="Add Artist" loading={loadingData}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {displayMessage && (
          <Message type={displayMessage.type} text={displayMessage.text} />
        )}
        <FormGroup>
          <Label htmlFor="name" required>
            Name
          </Label>
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
          <Label htmlFor="city_id" required>
            City
          </Label>
          <Select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a city</option>
            {cities.map(city => (
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
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
              </option>
            ))}
          </Select>
        </FormGroup>

        <SubmitButton loading={loading} loadingText="Adding...">
          Add Artist
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}
