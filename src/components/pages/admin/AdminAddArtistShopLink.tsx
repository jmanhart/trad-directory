import { useState, useEffect, useMemo } from "react";
import {
  addArtistShopLink,
  fetchArtists,
  fetchShops,
} from "../../../services/adminApi";
import AdminFormLayout from "./AdminFormLayout";
import {
  FormGroup,
  Label,
  Select,
  SubmitButton,
  Message,
  Input,
} from "./AdminFormComponents";
import styles from "./AdminForm.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle: string | null;
}

interface Shop {
  id: number;
  shop_name: string;
}

export default function AdminAddArtistShopLink() {
  const [formData, setFormData] = useState({
    artist_id: "",
    shop_id: "",
  });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
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
        const [artistsData, shopsData] = await Promise.all([
          fetchArtists(),
          fetchShops(),
        ]);
        setArtists(artistsData);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArtistSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArtistSearch(e.target.value);
  };

  const handleShopSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShopSearch(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate required fields
      if (!formData.artist_id || !formData.shop_id) {
        setMessage({
          type: "error",
          text: "Please select both an artist and a shop",
        });
        setLoading(false);
        return;
      }

      const linkData = {
        artist_id: parseInt(formData.artist_id),
        shop_id: parseInt(formData.shop_id),
      };

      await addArtistShopLink(linkData);
      setMessage({
        type: "success",
        text: "Artist-shop link created successfully!",
      });

      // Reset form
      setFormData({
        artist_id: "",
        shop_id: "",
      });
      setArtistSearch("");
      setShopSearch("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create link",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected artist name for display
  const selectedArtist = artists.find(
    a => a.id === parseInt(formData.artist_id)
  );
  const selectedShop = shops.find(s => s.id === parseInt(formData.shop_id));

  return (
    <AdminFormLayout title="Link Artist to Shop" loading={loadingData}>
      <form onSubmit={handleSubmit} className={styles.form}>
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

        {message && <Message type={message.type} text={message.text} />}

        <SubmitButton loading={loading} loadingText="Linking...">
          Create Link
        </SubmitButton>
      </form>
    </AdminFormLayout>
  );
}
