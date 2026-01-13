import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { addArtistShopLink, fetchArtists, fetchShops } from "../../../services/adminApi";
import styles from "./AdminAddArtistShopLink.module.css";

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
      (artist) =>
        artist.name.toLowerCase().includes(searchLower) ||
        artist.instagram_handle?.toLowerCase().includes(searchLower)
    );
  }, [artists, artistSearch]);

  // Filter shops based on search
  const filteredShops = useMemo(() => {
    if (!shopSearch) return shops;
    const searchLower = shopSearch.toLowerCase();
    return shops.filter((shop) =>
      shop.shop_name.toLowerCase().includes(searchLower)
    );
  }, [shops, shopSearch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    (a) => a.id === parseInt(formData.artist_id)
  );
  const selectedShop = shops.find((s) => s.id === parseInt(formData.shop_id));

  if (loadingData) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Link Artist to Shop</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/admin" className={styles.backLink}>← Back to Admin</Link>
      <h1 className={styles.title}>Link Artist to Shop</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="artist_search" className={styles.label}>
            Search Artist <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="artist_search"
            value={artistSearch}
            onChange={handleArtistSearchChange}
            className={styles.searchInput}
            placeholder="Type to search artists..."
          />
          <select
            id="artist_id"
            name="artist_id"
            value={formData.artist_id}
            onChange={handleChange}
            className={styles.select}
            required
            size={Math.min(filteredArtists.length + 1, 10)}
          >
            <option value="">Select an artist</option>
            {filteredArtists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
                {artist.instagram_handle ? ` (@${artist.instagram_handle})` : ""}
              </option>
            ))}
          </select>
          {selectedArtist && (
            <p className={styles.selectedInfo}>
              Selected: <strong>{selectedArtist.name}</strong>
            </p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="shop_search" className={styles.label}>
            Search Shop <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="shop_search"
            value={shopSearch}
            onChange={handleShopSearchChange}
            className={styles.searchInput}
            placeholder="Type to search shops..."
          />
          <select
            id="shop_id"
            name="shop_id"
            value={formData.shop_id}
            onChange={handleChange}
            className={styles.select}
            required
            size={Math.min(filteredShops.length + 1, 10)}
          >
            <option value="">Select a shop</option>
            {filteredShops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
              </option>
            ))}
          </select>
          {selectedShop && (
            <p className={styles.selectedInfo}>
              Selected: <strong>{selectedShop.shop_name}</strong>
            </p>
          )}
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
          {loading ? "Linking..." : "Create Link"}
        </button>
      </form>
    </div>
  );
}

