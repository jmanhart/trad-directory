import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Message, MessageWithRetry, Input, FormGroup, Label, Select } from "./AdminFormComponents";
import { updateArtist, fetchArtistById, updateShop, fetchShopById } from "../../../services/adminApi";
import { useAdminData } from "./useAdminData";
import { getCityDisplayName } from "./adminUtils";
import styles from "./AdminAllData.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle: string | null;
  is_traveling: boolean | null;
  city_name?: string | null;
  state_name?: string | null;
  country_name?: string | null;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}

interface Shop {
  id: number;
  shop_name: string;
  instagram_handle: string | null;
  address: string | null;
  city_name?: string | null;
  state_name?: string | null;
  country_name?: string | null;
}

interface ArtistFormData {
  name: string;
  instagram_handle: string;
  gender: string;
  url: string;
  contact: string;
  city_id: string;
  shop_id: string;
  is_traveling: boolean;
}

interface ShopFormData {
  shop_name: string;
  instagram_handle: string;
  address: string;
  contact: string;
  phone_number: string;
  website_url: string;
  city_id: string;
}

type TabType = "artists" | "shops" | "cities" | "countries" | "states";
type ArtistSortColumn = "id" | "name" | "instagram_handle" | "location" | "shop_name" | "is_traveling";
type ShopSortColumn = "id" | "shop_name" | "instagram_handle" | "location" | "address";
type SortColumn = ArtistSortColumn | ShopSortColumn;
type SortDirection = "asc" | "desc";

export default function AdminAllData() {
  const [activeTab, setActiveTab] = useState<TabType>("artists");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtistId, setEditingArtistId] = useState<number | null>(null);
  const [editingShopId, setEditingShopId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ArtistFormData | null>(null);
  const [shopFormData, setShopFormData] = useState<ShopFormData | null>(null);
  const [originalFormData, setOriginalFormData] = useState<ArtistFormData | null>(null);
  const [originalShopFormData, setOriginalShopFormData] = useState<ShopFormData | null>(null);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [loadingShop, setLoadingShop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const { cities, shops } = useAdminData({
    loadCities: true,
    loadShops: true,
  });

  useEffect(() => {
    if (activeTab === "artists") {
      loadArtists();
    } else if (activeTab === "shops") {
      loadShops();
    }
  }, [activeTab]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use dedicated admin endpoint that returns all artists
      const apiUrl = import.meta.env.VITE_API_URL || "/api/listAllArtists";
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `Failed to fetch artists: ${response.status}`
        );
      }
      
      const result = await response.json();
      setArtists(result.artists || []);
    } catch (err) {
      setError({
        type: "error",
        text: `Failed to load artists: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || "/api/listAllShops";
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `Failed to fetch shops: ${response.status}`
        );
      }
      
      const result = await response.json();
      setAllShops(result.shops || []);
    } catch (err) {
      setError({
        type: "error",
        text: `Failed to load shops: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (item: Artist | Shop) => {
    const parts = [];
    if (item.city_name) parts.push(item.city_name);
    if (item.state_name) parts.push(item.state_name);
    if (item.country_name) parts.push(item.country_name);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  // Filter and sort artists
  const filteredAndSortedArtists = useMemo(() => {
    let filtered = artists;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = artists.filter((artist) => {
        const location = formatLocation(artist).toLowerCase();
        return (
          artist.name.toLowerCase().includes(query) ||
          (artist.instagram_handle && artist.instagram_handle.toLowerCase().includes(query)) ||
          location.includes(query) ||
          (artist.shop_name && artist.shop_name.toLowerCase().includes(query)) ||
          artist.id.toString().includes(query)
        );
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (sortColumn) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "instagram_handle":
          aValue = (a.instagram_handle || "").toLowerCase();
          bValue = (b.instagram_handle || "").toLowerCase();
          break;
        case "location":
          aValue = formatLocation(a).toLowerCase();
          bValue = formatLocation(b).toLowerCase();
          break;
        case "shop_name":
          aValue = (a.shop_name || "").toLowerCase();
          bValue = (b.shop_name || "").toLowerCase();
          break;
        case "is_traveling":
          aValue = a.is_traveling ? 1 : 0;
          bValue = b.is_traveling ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [artists, searchQuery, sortColumn, sortDirection]);

  // Filter and sort shops
  const filteredAndSortedShops = useMemo(() => {
    let filtered = allShops;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allShops.filter((shop) => {
        const location = formatLocation(shop).toLowerCase();
        return (
          shop.shop_name.toLowerCase().includes(query) ||
          (shop.instagram_handle && shop.instagram_handle.toLowerCase().includes(query)) ||
          location.includes(query) ||
          (shop.address && shop.address.toLowerCase().includes(query)) ||
          shop.id.toString().includes(query)
        );
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "shop_name":
          aValue = a.shop_name.toLowerCase();
          bValue = b.shop_name.toLowerCase();
          break;
        case "instagram_handle":
          aValue = (a.instagram_handle || "").toLowerCase();
          bValue = (b.instagram_handle || "").toLowerCase();
          break;
        case "location":
          aValue = formatLocation(a).toLowerCase();
          bValue = formatLocation(b).toLowerCase();
          break;
        case "address":
          aValue = (a.address || "").toLowerCase();
          bValue = (b.address || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allShops, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleRetry = () => {
    if (activeTab === "artists") {
      loadArtists();
    } else if (activeTab === "shops") {
      loadShops();
    }
  };

  const handleEditClick = async (artistId: number) => {
    try {
      setLoadingArtist(true);
      setSaveError(null);
      const artist = await fetchArtistById(artistId);
      
      const formData: ArtistFormData = {
        name: artist.name || "",
        instagram_handle: artist.instagram_handle || "",
        gender: artist.gender || "",
        url: artist.url || "",
        contact: artist.contact || "",
        city_id: artist.city_id?.toString() || "",
        shop_id: artist.shop_id?.toString() || "",
        is_traveling: artist.is_traveling || false,
      };
      
      setFormData(formData);
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
      setEditingArtistId(artistId);
      setIsModalOpen(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load artist data");
    } finally {
      setLoadingArtist(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(null);
    setShopFormData(null);
    setOriginalFormData(null);
    setOriginalShopFormData(null);
    setEditingArtistId(null);
    setEditingShopId(null);
    setSaveError(null);
  };

  const handleFormChange = (field: keyof ArtistFormData, value: string | boolean) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleShopFormChange = (field: keyof ShopFormData, value: string) => {
    if (!shopFormData) return;
    setShopFormData({ ...shopFormData, [field]: value });
  };

  const hasChanges = useMemo(() => {
    if (editingArtistId && formData && originalFormData) {
      return JSON.stringify(formData) !== JSON.stringify(originalFormData);
    }
    if (editingShopId && shopFormData && originalShopFormData) {
      return JSON.stringify(shopFormData) !== JSON.stringify(originalShopFormData);
    }
    return false;
  }, [formData, originalFormData, shopFormData, originalShopFormData, editingArtistId, editingShopId]);

  const handleEditShopClick = async (shopId: number) => {
    try {
      setLoadingShop(true);
      setSaveError(null);
      const shop = await fetchShopById(shopId);
      
      const formData: ShopFormData = {
        shop_name: shop.shop_name || "",
        instagram_handle: shop.instagram_handle || "",
        address: shop.address || "",
        contact: shop.contact || "",
        phone_number: shop.phone_number || "",
        website_url: shop.website_url || "",
        city_id: shop.city_id?.toString() || "",
      };
      
      setShopFormData(formData);
      setOriginalShopFormData(JSON.parse(JSON.stringify(formData)));
      setEditingShopId(shopId);
      setIsModalOpen(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load shop data");
    } finally {
      setLoadingShop(false);
    }
  };

  const handleSave = async () => {
    if (editingArtistId && formData) {
      try {
        setSaving(true);
        setSaveError(null);
        
        await updateArtist({
          id: editingArtistId,
          name: formData.name,
          instagram_handle: formData.instagram_handle || undefined,
          gender: formData.gender || undefined,
          url: formData.url || undefined,
          contact: formData.contact || undefined,
          city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
          shop_id: formData.shop_id ? parseInt(formData.shop_id) : undefined,
          is_traveling: formData.is_traveling,
        });
        
        // Reload artists list
        await loadArtists();
        handleCloseModal();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setSaving(false);
      }
    } else if (editingShopId && shopFormData) {
      try {
        setSaving(true);
        setSaveError(null);
        
        await updateShop({
          id: editingShopId,
          shop_name: shopFormData.shop_name,
          instagram_handle: shopFormData.instagram_handle || undefined,
          address: shopFormData.address || undefined,
          contact: shopFormData.contact || undefined,
          phone_number: shopFormData.phone_number || undefined,
          website_url: shopFormData.website_url || undefined,
          city_id: shopFormData.city_id ? parseInt(shopFormData.city_id) : undefined,
        });
        
        // Reload shops list
        await loadShops();
        handleCloseModal();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <Link to="/admin" className={styles.backLink}>← Back to Admin</Link>
        <h1 className={styles.title}>ALL DATA</h1>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "artists" ? styles.active : ""}`}
            onClick={() => setActiveTab("artists")}
          >
            Artists
          </button>
          <button
            className={`${styles.tab} ${activeTab === "shops" ? styles.active : ""}`}
            onClick={() => setActiveTab("shops")}
          >
            Shops
          </button>
          <button
            className={`${styles.tab} ${activeTab === "cities" ? styles.active : ""}`}
            onClick={() => setActiveTab("cities")}
            disabled
          >
            Cities
          </button>
          <button
            className={`${styles.tab} ${activeTab === "countries" ? styles.active : ""}`}
            onClick={() => setActiveTab("countries")}
            disabled
          >
            Countries
          </button>
          <button
            className={`${styles.tab} ${activeTab === "states" ? styles.active : ""}`}
            onClick={() => setActiveTab("states")}
            disabled
          >
            States
          </button>
        </div>

        {/* Search Bar */}
        {(activeTab === "artists" || activeTab === "shops") && !loading && (
          <div className={styles.searchContainer}>
            <Input
              type="text"
              placeholder={
                activeTab === "artists"
                  ? "Search artists by name, Instagram, location, shop, or ID..."
                  : "Search shops by name, Instagram, location, address, or ID..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <span className={styles.resultCount}>
                {activeTab === "artists"
                  ? `${filteredAndSortedArtists.length} of ${artists.length} artists`
                  : `${filteredAndSortedShops.length} of ${allShops.length} shops`}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {error && (
            <MessageWithRetry
              type={error.type}
              text={error.text}
              onRetry={handleRetry}
              retryLoading={loading}
            />
          )}

          {activeTab === "artists" && (
            <div className={styles.tableWrapper}>
              {loading ? (
                <div className={styles.loading}>Loading artists...</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("id")}
                      >
                        ID {getSortIcon("id")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("name")}
                      >
                        Name {getSortIcon("name")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("instagram_handle")}
                      >
                        Instagram {getSortIcon("instagram_handle")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("location")}
                      >
                        Location {getSortIcon("location")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("shop_name")}
                      >
                        Shop {getSortIcon("shop_name")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("is_traveling")}
                      >
                        Traveling {getSortIcon("is_traveling")}
                      </th>
                      <th className={styles.actionHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedArtists.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.emptyCell}>
                          {searchQuery ? "No artists match your search" : "No artists found"}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedArtists.map((artist) => (
                        <tr key={artist.id}>
                          <td className={styles.idCell}>{artist.id}</td>
                          <td className={styles.nameCell}>{artist.name}</td>
                          <td className={styles.instagramCell}>
                            {artist.instagram_handle ? (
                              <a
                                href={`https://instagram.com/${artist.instagram_handle.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                              >
                                {artist.instagram_handle}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={styles.locationCell}>
                            {formatLocation(artist)}
                          </td>
                          <td className={styles.shopCell}>
                            {artist.shop_name || "—"}
                          </td>
                          <td className={styles.travelingCell}>
                            {artist.is_traveling ? "✓" : "—"}
                          </td>
                          <td className={styles.actionCell}>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditClick(artist.id)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "shops" && (
            <div className={styles.tableWrapper}>
              {loading ? (
                <div className={styles.loading}>Loading shops...</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("id")}
                      >
                        ID {getSortIcon("id")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("shop_name")}
                      >
                        Shop Name {getSortIcon("shop_name")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("instagram_handle")}
                      >
                        Instagram {getSortIcon("instagram_handle")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("location")}
                      >
                        Location {getSortIcon("location")}
                      </th>
                      <th 
                        className={styles.sortableHeader}
                        onClick={() => handleSort("address")}
                      >
                        Address {getSortIcon("address")}
                      </th>
                      <th className={styles.actionHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedShops.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                          {searchQuery ? "No shops match your search" : "No shops found"}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedShops.map((shop) => (
                        <tr key={shop.id}>
                          <td className={styles.idCell}>{shop.id}</td>
                          <td className={styles.nameCell}>{shop.shop_name}</td>
                          <td className={styles.instagramCell}>
                            {shop.instagram_handle ? (
                              <a
                                href={`https://instagram.com/${shop.instagram_handle.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                              >
                                {shop.instagram_handle}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={styles.locationCell}>
                            {formatLocation(shop)}
                          </td>
                          <td className={styles.shopCell}>
                            {shop.address || "—"}
                          </td>
                          <td className={styles.actionCell}>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditShopClick(shop.id)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab !== "artists" && activeTab !== "shops" && (
            <div className={styles.comingSoon}>
              <p>Coming soon: {activeTab} table view</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingArtistId ? "Edit Artist" : "Edit Shop"}
              </h2>
              <button className={styles.modalClose} onClick={handleCloseModal}>×</button>
            </div>
            
            <div className={styles.modalContent}>
              {editingArtistId && loadingArtist ? (
                <div className={styles.loading}>Loading artist data...</div>
              ) : editingShopId && loadingShop ? (
                <div className={styles.loading}>Loading shop data...</div>
              ) : editingArtistId && formData ? (
                <>
                  {saveError && (
                    <Message type="error" text={saveError} />
                  )}
                  
                  <form className={styles.modalForm}>
                    <FormGroup>
                      <Label htmlFor="name" required>Name</Label>
                      <Input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="instagram_handle">Instagram Handle</Label>
                      <Input
                        type="text"
                        id="instagram_handle"
                        value={formData.instagram_handle}
                        onChange={(e) => handleFormChange("instagram_handle", e.target.value)}
                        placeholder="@username or username"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="gender">Gender</Label>
                      <Input
                        type="text"
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => handleFormChange("gender", e.target.value)}
                        placeholder="Gender"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        type="url"
                        id="url"
                        value={formData.url}
                        onChange={(e) => handleFormChange("url", e.target.value)}
                        placeholder="https://example.com"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="contact">Contact</Label>
                      <Input
                        type="text"
                        id="contact"
                        value={formData.contact}
                        onChange={(e) => handleFormChange("contact", e.target.value)}
                        placeholder="Email or phone number"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="city_id" required>City</Label>
                      <Select
                        id="city_id"
                        value={formData.city_id}
                        onChange={(e) => handleFormChange("city_id", e.target.value)}
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
                        value={formData.shop_id}
                        onChange={(e) => handleFormChange("shop_id", e.target.value)}
                      >
                        <option value="">No shop</option>
                        {shops.map(shop => (
                          <option key={shop.id} value={shop.id}>
                            {shop.shop_name}
                          </option>
                        ))}
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Input
                          type="checkbox"
                          id="is_traveling"
                          checked={formData.is_traveling}
                          onChange={(e) => handleFormChange("is_traveling", e.target.checked)}
                        />
                        <Label htmlFor="is_traveling" style={{ margin: 0, cursor: "pointer" }}>
                          Traveling Artist
                        </Label>
                      </div>
                    </FormGroup>
                  </form>
                </>
              ) : editingShopId && shopFormData ? (
                <>
                  {saveError && (
                    <Message type="error" text={saveError} />
                  )}
                  
                  <form className={styles.modalForm}>
                    <FormGroup>
                      <Label htmlFor="shop_name" required>Shop Name</Label>
                      <Input
                        type="text"
                        id="shop_name"
                        value={shopFormData.shop_name}
                        onChange={(e) => handleShopFormChange("shop_name", e.target.value)}
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="shop_instagram_handle">Instagram Handle</Label>
                      <Input
                        type="text"
                        id="shop_instagram_handle"
                        value={shopFormData.instagram_handle}
                        onChange={(e) => handleShopFormChange("instagram_handle", e.target.value)}
                        placeholder="@username or username"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="shop_address">Address</Label>
                      <Input
                        type="text"
                        id="shop_address"
                        value={shopFormData.address}
                        onChange={(e) => handleShopFormChange("address", e.target.value)}
                        placeholder="Street address"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="shop_contact">Contact</Label>
                      <Input
                        type="text"
                        id="shop_contact"
                        value={shopFormData.contact}
                        onChange={(e) => handleShopFormChange("contact", e.target.value)}
                        placeholder="Email or other contact"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="shop_phone_number">Phone Number</Label>
                      <Input
                        type="tel"
                        id="shop_phone_number"
                        value={shopFormData.phone_number}
                        onChange={(e) => handleShopFormChange("phone_number", e.target.value)}
                        placeholder="Phone number"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="shop_website_url">Website URL</Label>
                      <Input
                        type="url"
                        id="shop_website_url"
                        value={shopFormData.website_url}
                        onChange={(e) => handleShopFormChange("website_url", e.target.value)}
                        placeholder="https://example.com"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="shop_city_id" required>City</Label>
                      <Select
                        id="shop_city_id"
                        value={shopFormData.city_id}
                        onChange={(e) => handleShopFormChange("city_id", e.target.value)}
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
                  </form>
                </>
              ) : null}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancel
              </button>
              {hasChanges && (
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={
                    saving ||
                    (editingArtistId && (!formData?.name || !formData?.city_id)) ||
                    (editingShopId && (!shopFormData?.shop_name || !shopFormData?.city_id))
                  }
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
