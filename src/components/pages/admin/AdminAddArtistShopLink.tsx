import { useState, useMemo } from "react";
import { addArtistShopLink } from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import {
  FormGroup,
  Label,
  Select,
  SubmitButton,
  Message,
  Input,
} from "./AdminFormComponents";
import { useAdminData } from "./useAdminData";
import { useAdminForm } from "./useAdminForm";
import styles from "./AdminForm.module.css";

interface LinkFormData {
  artist_id: string;
  shop_id: string;
}

export default function AdminAddArtistShopLink() {
  const { artists, shops, loading: loadingData, error: dataError } = useAdminData({
    loadArtists: true,
    loadShops: true,
  });

  const [artistSearch, setArtistSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");

  const {
    formData,
    loading,
    message,
    handleChange: baseHandleChange,
    handleSubmit: baseHandleSubmit,
  } = useAdminForm<LinkFormData, any>({
    initialData: {
      artist_id: "",
      shop_id: "",
    },
    onSubmit: async (data) => {
      await addArtistShopLink(data);
    },
    transformData: (formData) => ({
      artist_id: parseInt(formData.artist_id),
      shop_id: parseInt(formData.shop_id),
    }),
    validateData: (formData) => {
      if (!formData.artist_id || !formData.shop_id) {
        return "Please select both an artist and a shop";
      }
      return null;
    },
    getSuccessMessage: () => "Artist-shop link created successfully!",
    onSuccess: () => {
      setArtistSearch("");
      setShopSearch("");
    },
  });

  // Override handleChange to keep base functionality
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    baseHandleChange(e);
  };

  // Filter artists based on search
  const filteredArtists = useMemo(() => {
    if (!artistSearch) return artists;
    const searchLower = artistSearch.toLowerCase();
    return artists.filter(
      artist =>
        artist.name.toLowerCase().includes(searchLower) ||
        artist.instagram_handle?.toLowerCase().includes(searchLower)
    );
  }, [artists, artistSearch]);

  // Filter shops based on search
  const filteredShops = useMemo(() => {
    if (!shopSearch) return shops;
    const searchLower = shopSearch.toLowerCase();
    return shops.filter(shop =>
      shop.shop_name.toLowerCase().includes(searchLower)
    );
  }, [shops, shopSearch]);

  const handleArtistSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArtistSearch(e.target.value);
  };

  const handleShopSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShopSearch(e.target.value);
  };

  // Use data loading error if present, otherwise use form message
  const displayMessage = dataError || message;

  // Get selected artist name for display
  const selectedArtist = artists.find(
    a => a.id === parseInt(formData.artist_id)
  );
  const selectedShop = shops.find(s => s.id === parseInt(formData.shop_id));

  return (
    <AdminFormLayout title="Link Artist to Shop" loading={loadingData}>
      <form onSubmit={baseHandleSubmit} className={styles.form}>
        {displayMessage && <Message type={displayMessage.type} text={displayMessage.text} />}
        <FormGroup>
          <Label htmlFor="artist_search" required>
            Search Artist
          </Label>
          <Input
            type="text"
            id="artist_search"
            value={artistSearch}
            onChange={handleArtistSearchChange}
            className={styles.searchInput}
            placeholder="Type to search artists..."
          />
          <Select
            id="artist_id"
            name="artist_id"
            value={formData.artist_id}
            onChange={handleChange}
            required
            size={Math.min(filteredArtists.length + 1, 10)}
          >
            <option value="">Select an artist</option>
            {filteredArtists.map(artist => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
                {artist.instagram_handle
                  ? ` (@${artist.instagram_handle})`
                  : ""}
              </option>
            ))}
          </Select>
          {selectedArtist && (
            <p className={styles.selectedInfo}>
              Selected: <strong>{selectedArtist.name}</strong>
            </p>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="shop_search" required>
            Search Shop
          </Label>
          <Input
            type="text"
            id="shop_search"
            value={shopSearch}
            onChange={handleShopSearchChange}
            className={styles.searchInput}
            placeholder="Type to search shops..."
          />
          <Select
            id="shop_id"
            name="shop_id"
            value={formData.shop_id}
            onChange={handleChange}
            required
            size={Math.min(filteredShops.length + 1, 10)}
          >
            <option value="">Select a shop</option>
            {filteredShops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
              </option>
            ))}
          </Select>
          {selectedShop && (
            <p className={styles.selectedInfo}>
              Selected: <strong>{selectedShop.shop_name}</strong>
            </p>
          )}
        </FormGroup>

        <SubmitButton loading={loading} loadingText="Linking...">
          Create Link
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}
