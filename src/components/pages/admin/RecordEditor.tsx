import { useState, useEffect, useMemo } from "react";
import { CONTINENT_OPTIONS } from "../../../types/entities";
import {
  Message,
  Input,
  FormGroup,
  Label,
  Select,
} from "./AdminFormComponents";
import {
  updateArtist,
  fetchArtistById,
  updateShop,
  fetchShopById,
  updateCity,
  updateCountry,
  addArtistLocation,
  deleteArtistLocation,
  deleteArtist,
  deleteShop,
  deleteCity,
  deleteCountry,
  fetchLinkStatuses,
  type LinkStatusMaps,
} from "../../../services/adminApi";
import { useAdminData } from "./useAdminData";
import type { City } from "./adminTypes";
import { getCityDisplayName } from "./adminUtils";
import styles from "./AdminAllData.module.css";
import AdminDetailPanel from "./AdminDetailPanel";
import { StatusPill, fmtHealthDate } from "./StatusPill";

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

interface CityFormData {
  city_name: string;
  state_id: string;
}

interface CountryFormData {
  country_name: string;
  continent: string;
}

export type EditorTarget =
  | { type: "artist"; id: number }
  | { type: "shop"; id: number }
  | { type: "city"; city: City }
  | {
      type: "country";
      country: { id: number; country_name: string; continent: string | null };
    };

interface RecordEditorProps {
  target: EditorTarget | null;
  onClose: () => void;
  onMutated?: (target: EditorTarget, action: "saved" | "deleted") => void;
  /** Render as a fixed right-side overlay (pages without the data-browser flex layout). */
  overlay?: boolean;
}

export default function RecordEditor({
  target,
  onClose,
  onMutated,
  overlay,
}: RecordEditorProps) {
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");
  const [editingArtistId, setEditingArtistId] = useState<number | null>(null);
  const [editingShopId, setEditingShopId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ArtistFormData | null>(null);
  const [shopFormData, setShopFormData] = useState<ShopFormData | null>(null);
  const [originalFormData, setOriginalFormData] =
    useState<ArtistFormData | null>(null);
  const [originalShopFormData, setOriginalShopFormData] =
    useState<ShopFormData | null>(null);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [loadingShop, setLoadingShop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // City / country edit state
  const [editingCityId, setEditingCityId] = useState<number | null>(null);
  const [editingCountryId, setEditingCountryId] = useState<number | null>(null);
  const [cityFormData, setCityFormData] = useState<CityFormData | null>(null);
  const [countryFormData, setCountryFormData] =
    useState<CountryFormData | null>(null);
  const [originalCityFormData, setOriginalCityFormData] =
    useState<CityFormData | null>(null);
  const [originalCountryFormData, setOriginalCountryFormData] =
    useState<CountryFormData | null>(null);

  // Secondary locations state
  const [artistLocations, setArtistLocations] = useState<any[]>([]);
  const [addingLocation, setAddingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(
    null
  );
  const [newLocationCityId, setNewLocationCityId] = useState("");
  const [newLocationShopId, setNewLocationShopId] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const { cities, shops, states, refetch } = useAdminData({
    loadCities: true,
    loadShops: true,
    loadStates: true,
  });

  const [linkStatuses, setLinkStatuses] = useState<LinkStatusMaps>({
    artists: {},
    shops: {},
  });

  useEffect(() => {
    fetchLinkStatuses().then(setLinkStatuses).catch(() => {});
  }, []);

  const clearPanelSelection = () => {
    setEditingArtistId(null);
    setEditingShopId(null);
    setEditingCityId(null);
    setEditingCountryId(null);
    setFormData(null);
    setShopFormData(null);
    setCityFormData(null);
    setCountryFormData(null);
    setArtistLocations([]);
    setConfirmingDelete(false);
  };

  const loadCity = (city: City) => {
    setSaveError(null);
    clearPanelSelection();
    const formData: CityFormData = {
      city_name: city.city_name,
      state_id: city.state_id?.toString() || "",
    };
    setCityFormData(formData);
    setOriginalCityFormData(JSON.parse(JSON.stringify(formData)));
    setEditingCityId(city.id);
    setPanelMode("view");
  };

  const loadCountry = (country: {
    id: number;
    country_name: string;
    continent: string | null;
  }) => {
    setSaveError(null);
    clearPanelSelection();
    const formData: CountryFormData = {
      country_name: country.country_name,
      continent: country.continent || "",
    };
    setCountryFormData(formData);
    setOriginalCountryFormData(JSON.parse(JSON.stringify(formData)));
    setEditingCountryId(country.id);
    setPanelMode("view");
  };

  const handleCityFormChange = (field: keyof CityFormData, value: string) => {
    if (!cityFormData) return;
    setCityFormData({ ...cityFormData, [field]: value });
  };

  const handleCountryFormChange = (
    field: keyof CountryFormData,
    value: string
  ) => {
    if (!countryFormData) return;
    setCountryFormData({ ...countryFormData, [field]: value });
  };

  const refreshArtistLocations = async (artistId: number) => {
    try {
      const artist = await fetchArtistById(artistId);
      setArtistLocations(artist.locations || []);
    } catch {
      // Non-blocking
    }
  };

  const handleAddSecondaryLocation = async () => {
    if (!editingArtistId || !newLocationCityId) return;
    try {
      setAddingLocation(true);
      setLocationError(null);
      await addArtistLocation(
        editingArtistId,
        parseInt(newLocationCityId),
        newLocationShopId ? parseInt(newLocationShopId) : undefined
      );
      setNewLocationCityId("");
      setNewLocationShopId("");
      await refreshArtistLocations(editingArtistId);
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "Failed to add location"
      );
    } finally {
      setAddingLocation(false);
    }
  };

  const handleDeleteSecondaryLocation = async (locationId: number) => {
    if (!editingArtistId) return;
    try {
      setDeletingLocationId(locationId);
      setLocationError(null);
      await deleteArtistLocation(locationId);
      await refreshArtistLocations(editingArtistId);
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "Failed to delete location"
      );
    } finally {
      setDeletingLocationId(null);
    }
  };

  const loadArtist = async (artistId: number) => {
    setSaveError(null);
    clearPanelSelection();
    setEditingArtistId(artistId);
    setPanelMode("view");
    setLoadingArtist(true);
    try {
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
      setArtistLocations(artist.locations || []);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to load artist data"
      );
    } finally {
      setLoadingArtist(false);
    }
  };

  const handleCloseModal = () => {
    setPanelMode("view");
    setFormData(null);
    setShopFormData(null);
    setCityFormData(null);
    setCountryFormData(null);
    setOriginalFormData(null);
    setOriginalShopFormData(null);
    setOriginalCityFormData(null);
    setOriginalCountryFormData(null);
    setEditingArtistId(null);
    setEditingShopId(null);
    setEditingCityId(null);
    setEditingCountryId(null);
    setSaveError(null);
    setConfirmingDelete(false);
    setArtistLocations([]);
    setNewLocationCityId("");
    setNewLocationShopId("");
    setLocationError(null);
    onClose();
  };

  const handleFormChange = (
    field: keyof ArtistFormData,
    value: string | boolean
  ) => {
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
      return (
        JSON.stringify(shopFormData) !== JSON.stringify(originalShopFormData)
      );
    }
    if (editingCityId && cityFormData && originalCityFormData) {
      return (
        JSON.stringify(cityFormData) !== JSON.stringify(originalCityFormData)
      );
    }
    if (editingCountryId && countryFormData && originalCountryFormData) {
      return (
        JSON.stringify(countryFormData) !==
        JSON.stringify(originalCountryFormData)
      );
    }
    return false;
  }, [
    formData,
    originalFormData,
    shopFormData,
    originalShopFormData,
    cityFormData,
    originalCityFormData,
    countryFormData,
    originalCountryFormData,
    editingArtistId,
    editingShopId,
    editingCityId,
    editingCountryId,
  ]);

  const loadShop = async (shopId: number) => {
    setSaveError(null);
    clearPanelSelection();
    setEditingShopId(shopId);
    setPanelMode("view");
    setLoadingShop(true);
    try {
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
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to load shop data"
      );
    } finally {
      setLoadingShop(false);
    }
  };

  // Open the editor whenever the target changes. Always opens in view mode.
  useEffect(() => {
    if (!target) return;
    clearPanelSelection();
    setPanelMode("view");
    switch (target.type) {
      case "artist":
        loadArtist(target.id);
        break;
      case "shop":
        loadShop(target.id);
        break;
      case "city":
        loadCity(target.city);
        break;
      case "country":
        loadCountry(target.country);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Short cascade-impact hint shown in the delete confirmation.
  const deleteImpact = editingArtistId
    ? "Removes the artist and unlinks it from shops, locations, and saved lists."
    : editingShopId
      ? "Removes the shop and unlinks its artists."
      : editingCityId
        ? "Blocked if any artists or shops still use this city."
        : editingCountryId
          ? "Blocked if any cities or states still use this country."
          : "";

  const handleDelete = async () => {
    setDeleting(true);
    setSaveError(null);
    try {
      if (editingArtistId) {
        await deleteArtist(editingArtistId);
      } else if (editingShopId) {
        await deleteShop(editingShopId);
      } else if (editingCityId) {
        await deleteCity(editingCityId);
      } else if (editingCountryId) {
        await deleteCountry(editingCountryId);
      }
      onMutated?.(target!, "deleted");
      handleCloseModal();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
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

        await refetch();
        onMutated?.(target!, "saved");
        handleCloseModal();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save changes"
        );
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
          city_id: shopFormData.city_id
            ? parseInt(shopFormData.city_id)
            : undefined,
        });

        await refetch();
        onMutated?.(target!, "saved");
        handleCloseModal();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save changes"
        );
      } finally {
        setSaving(false);
      }
    } else if (editingCityId && cityFormData) {
      try {
        setSaving(true);
        setSaveError(null);
        await updateCity({
          id: editingCityId,
          city_name: cityFormData.city_name.trim(),
          state_id: cityFormData.state_id
            ? parseInt(cityFormData.state_id, 10)
            : null,
        });
        await refetch();
        onMutated?.(target!, "saved");
        handleCloseModal();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save changes"
        );
      } finally {
        setSaving(false);
      }
    } else if (editingCountryId && countryFormData) {
      try {
        setSaving(true);
        setSaveError(null);
        await updateCountry({
          id: editingCountryId,
          country_name: countryFormData.country_name.trim(),
          continent: countryFormData.continent || undefined,
        });
        await refetch();
        onMutated?.(target!, "saved");
        handleCloseModal();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save changes"
        );
      } finally {
        setSaving(false);
      }
    }
  };

  const panelTitle =
    panelMode === "edit"
      ? editingArtistId
        ? "Edit Artist"
        : editingShopId
          ? "Edit Shop"
          : editingCityId
            ? "Edit City"
            : "Edit Country"
      : editingArtistId
        ? formData?.name || "Artist"
        : editingShopId
          ? shopFormData?.shop_name || "Shop"
          : editingCityId
            ? cityFormData?.city_name || "City"
            : countryFormData?.country_name || "Country";

  const cityLabel = (id: string) => {
    const c = cities.find(x => String(x.id) === id);
    return c ? getCityDisplayName(c) : "";
  };
  const shopLabel = (id: string) =>
    shops.find(x => String(x.id) === id)?.shop_name || "";
  const stateLabel = (id: string) =>
    states.find(x => String(x.id) === id)?.state_name || "";

  const viewRow = (label: string, value: string) => (
    <div className={styles.viewRow}>
      <span className={styles.viewLabel}>{label}</span>
      <span className={styles.viewValue}>{value || "—"}</span>
    </div>
  );

  const renderLinkHealth = (rec?: LinkStatusMaps["artists"][number]) => (
    <>
      <div className={styles.viewRow}>
        <span className={styles.viewLabel}>Link status</span>
        <span className={styles.viewValue}>
          <StatusPill status={rec?.status} />
        </span>
      </div>
      {viewRow("Last alive", fmtHealthDate(rec?.last_alive_at))}
      {viewRow("Last checked", fmtHealthDate(rec?.checked_at))}
    </>
  );

  const renderPanelView = () => {
    if (editingArtistId && formData) {
      const secondary = artistLocations
        .filter(l => !l.is_primary)
        .map(l => [l.city_name, l.state_name].filter(Boolean).join(", "))
        .join(" · ");
      return (
        <div className={styles.viewList}>
          {viewRow("Name", formData.name)}
          {viewRow("Instagram", formData.instagram_handle)}
          {viewRow("Gender", formData.gender)}
          {viewRow("URL", formData.url)}
          {viewRow("Contact", formData.contact)}
          {viewRow("City", cityLabel(formData.city_id))}
          {viewRow("Shop", shopLabel(formData.shop_id))}
          {viewRow("Traveling", formData.is_traveling ? "Yes" : "No")}
          {viewRow("Secondary locations", secondary)}
          {renderLinkHealth(linkStatuses.artists[editingArtistId])}
        </div>
      );
    }
    if (editingShopId && shopFormData) {
      return (
        <div className={styles.viewList}>
          {viewRow("Shop name", shopFormData.shop_name)}
          {viewRow("Instagram", shopFormData.instagram_handle)}
          {viewRow("Address", shopFormData.address)}
          {viewRow("Contact", shopFormData.contact)}
          {viewRow("Phone", shopFormData.phone_number)}
          {viewRow("Website", shopFormData.website_url)}
          {viewRow("City", cityLabel(shopFormData.city_id))}
          {renderLinkHealth(linkStatuses.shops[editingShopId])}
        </div>
      );
    }
    if (editingCityId && cityFormData) {
      return (
        <div className={styles.viewList}>
          {viewRow("City name", cityFormData.city_name)}
          {viewRow("State", stateLabel(cityFormData.state_id))}
        </div>
      );
    }
    if (editingCountryId && countryFormData) {
      return (
        <div className={styles.viewList}>
          {viewRow("Country name", countryFormData.country_name)}
          {viewRow("Continent", countryFormData.continent)}
        </div>
      );
    }
    return null;
  };

  const renderPanelBody = () => {
    if (editingArtistId && loadingArtist) {
      return <div className={styles.loading}>Loading artist data...</div>;
    }
    if (editingShopId && loadingShop) {
      return <div className={styles.loading}>Loading shop data...</div>;
    }
    if (panelMode === "view") return renderPanelView();
    return (
      <div className={styles.editForms}>
                {editingArtistId && loadingArtist ? (
                  <div className={styles.loading}>Loading artist data...</div>
                ) : editingShopId && loadingShop ? (
                  <div className={styles.loading}>Loading shop data...</div>
                ) : editingCityId && cityFormData ? (
                  <>
                    {saveError && <Message type="error" text={saveError} />}
                    <form className={styles.modalForm}>
                      <FormGroup>
                        <Label htmlFor="city_name" required>
                          City Name
                        </Label>
                        <Input
                          type="text"
                          id="city_name"
                          value={cityFormData.city_name}
                          onChange={e =>
                            handleCityFormChange("city_name", e.target.value)
                          }
                          required
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label htmlFor="city_state_id">State</Label>
                        <Select
                          id="city_state_id"
                          value={cityFormData.state_id}
                          onChange={e =>
                            handleCityFormChange("state_id", e.target.value)
                          }
                        >
                          <option value="">No state</option>
                          {states.map(state => (
                            <option key={state.id} value={state.id}>
                              {state.state_name}
                              {state.country_name
                                ? ` (${state.country_name})`
                                : ""}
                            </option>
                          ))}
                        </Select>
                      </FormGroup>
                    </form>
                  </>
                ) : editingCountryId && countryFormData ? (
                  <>
                    {saveError && <Message type="error" text={saveError} />}
                    <form className={styles.modalForm}>
                      <FormGroup>
                        <Label htmlFor="country_name" required>
                          Country Name
                        </Label>
                        <Input
                          type="text"
                          id="country_name"
                          value={countryFormData.country_name}
                          onChange={e =>
                            handleCountryFormChange(
                              "country_name",
                              e.target.value
                            )
                          }
                          required
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label htmlFor="continent">Continent</Label>
                        <Select
                          id="continent"
                          value={countryFormData.continent}
                          onChange={e =>
                            handleCountryFormChange(
                              "continent",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select continent</option>
                          {CONTINENT_OPTIONS.map(c => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </FormGroup>
                    </form>
                  </>
                ) : editingArtistId && formData ? (
                  <>
                    {saveError && <Message type="error" text={saveError} />}

                    <form className={styles.modalForm}>
                      <FormGroup>
                        <Label htmlFor="name" required>
                          Name
                        </Label>
                        <Input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={e =>
                            handleFormChange("name", e.target.value)
                          }
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="instagram_handle">
                          Instagram Handle
                        </Label>
                        <Input
                          type="text"
                          id="instagram_handle"
                          value={formData.instagram_handle}
                          onChange={e =>
                            handleFormChange("instagram_handle", e.target.value)
                          }
                          placeholder="@username or username"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="gender">Gender</Label>
                        <Input
                          type="text"
                          id="gender"
                          value={formData.gender}
                          onChange={e =>
                            handleFormChange("gender", e.target.value)
                          }
                          placeholder="Gender"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          type="url"
                          id="url"
                          value={formData.url}
                          onChange={e =>
                            handleFormChange("url", e.target.value)
                          }
                          placeholder="https://example.com"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="contact">Contact</Label>
                        <Input
                          type="text"
                          id="contact"
                          value={formData.contact}
                          onChange={e =>
                            handleFormChange("contact", e.target.value)
                          }
                          placeholder="Email or phone number"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="city_id" required>
                          City
                        </Label>
                        <Select
                          id="city_id"
                          value={formData.city_id}
                          onChange={e =>
                            handleFormChange("city_id", e.target.value)
                          }
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
                          onChange={e =>
                            handleFormChange("shop_id", e.target.value)
                          }
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Input
                            type="checkbox"
                            id="is_traveling"
                            checked={formData.is_traveling}
                            onChange={e =>
                              handleFormChange("is_traveling", e.target.checked)
                            }
                          />
                          <Label
                            htmlFor="is_traveling"
                            style={{ margin: 0, cursor: "pointer" }}
                          >
                            Traveling Artist
                          </Label>
                        </div>
                      </FormGroup>
                    </form>

                    {/* Secondary Locations */}
                    <div className={styles.secondaryLocations}>
                      <h3 className={styles.secondaryLocationsTitle}>
                        Secondary Locations
                      </h3>

                      {locationError && (
                        <Message type="error" text={locationError} />
                      )}

                      {artistLocations
                        .filter(loc => !loc.is_primary)
                        .map(loc => (
                          <div key={loc.id} className={styles.locationRow}>
                            <span className={styles.locationText}>
                              {[loc.city_name, loc.state_name, loc.country_name]
                                .filter(Boolean)
                                .join(", ")}
                              {loc.shop_name ? ` — ${loc.shop_name}` : ""}
                            </span>
                            <button
                              type="button"
                              className={styles.locationDeleteButton}
                              onClick={() =>
                                handleDeleteSecondaryLocation(loc.id)
                              }
                              disabled={deletingLocationId === loc.id}
                              title="Remove secondary location"
                            >
                              {deletingLocationId === loc.id ? "..." : "×"}
                            </button>
                          </div>
                        ))}

                      {artistLocations.filter(loc => !loc.is_primary).length ===
                        0 && (
                        <div className={styles.locationEmpty}>
                          No secondary locations
                        </div>
                      )}

                      <div className={styles.addLocationRow}>
                        <Select
                          value={newLocationCityId}
                          onChange={e => setNewLocationCityId(e.target.value)}
                        >
                          <option value="">City...</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>
                              {getCityDisplayName(city)}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={newLocationShopId}
                          onChange={e => setNewLocationShopId(e.target.value)}
                        >
                          <option value="">Shop (optional)</option>
                          {shops.map(shop => (
                            <option key={shop.id} value={shop.id}>
                              {shop.shop_name}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          className={styles.addLocationButton}
                          onClick={handleAddSecondaryLocation}
                          disabled={!newLocationCityId || addingLocation}
                        >
                          {addingLocation ? "..." : "Add"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : editingShopId && shopFormData ? (
                  <>
                    {saveError && <Message type="error" text={saveError} />}

                    <form className={styles.modalForm}>
                      <FormGroup>
                        <Label htmlFor="shop_name" required>
                          Shop Name
                        </Label>
                        <Input
                          type="text"
                          id="shop_name"
                          value={shopFormData.shop_name}
                          onChange={e =>
                            handleShopFormChange("shop_name", e.target.value)
                          }
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="shop_instagram_handle">
                          Instagram Handle
                        </Label>
                        <Input
                          type="text"
                          id="shop_instagram_handle"
                          value={shopFormData.instagram_handle}
                          onChange={e =>
                            handleShopFormChange(
                              "instagram_handle",
                              e.target.value
                            )
                          }
                          placeholder="@username or username"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="shop_address">Address</Label>
                        <Input
                          type="text"
                          id="shop_address"
                          value={shopFormData.address}
                          onChange={e =>
                            handleShopFormChange("address", e.target.value)
                          }
                          placeholder="Street address"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="shop_contact">Contact</Label>
                        <Input
                          type="text"
                          id="shop_contact"
                          value={shopFormData.contact}
                          onChange={e =>
                            handleShopFormChange("contact", e.target.value)
                          }
                          placeholder="Email or other contact"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="shop_phone_number">Phone Number</Label>
                        <Input
                          type="tel"
                          id="shop_phone_number"
                          value={shopFormData.phone_number}
                          onChange={e =>
                            handleShopFormChange("phone_number", e.target.value)
                          }
                          placeholder="Phone number"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="shop_website_url">Website URL</Label>
                        <Input
                          type="url"
                          id="shop_website_url"
                          value={shopFormData.website_url}
                          onChange={e =>
                            handleShopFormChange("website_url", e.target.value)
                          }
                          placeholder="https://example.com"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="shop_city_id" required>
                          City
                        </Label>
                        <Select
                          id="shop_city_id"
                          value={shopFormData.city_id}
                          onChange={e =>
                            handleShopFormChange("city_id", e.target.value)
                          }
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
    );
  };

  const renderPanelFooter = () => {
    if ((editingArtistId && loadingArtist) || (editingShopId && loadingShop)) {
      return null;
    }
    if (panelMode === "view") {
      return (
        <button
          type="button"
          className={styles.saveButton}
          onClick={() => setPanelMode("edit")}
        >
          Edit
        </button>
      );
    }
    return (
      <div className={styles.panelFooterInner}>
                <div className={styles.modalFooterLeft}>
                  {!confirmingDelete ? (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setConfirmingDelete(true)}
                      disabled={saving || deleting}
                    >
                      Delete
                    </button>
                  ) : (
                    <div className={styles.confirmDelete}>
                      <span className={styles.confirmText}>
                        {deleteImpact} Delete permanently?
                      </span>
                      <button
                        type="button"
                        className={styles.confirmDeleteYes}
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button
                        type="button"
                        className={styles.confirmDeleteNo}
                        onClick={() => setConfirmingDelete(false)}
                        disabled={deleting}
                      >
                        Keep
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.modalFooterRight}>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCloseModal}
                    disabled={saving || deleting}
                  >
                    Cancel
                  </button>
                  {hasChanges && (
                    <button
                      className={styles.saveButton}
                      onClick={handleSave}
                      disabled={
                        saving ||
                        (editingArtistId && !formData?.name) ||
                        (editingShopId &&
                          (!shopFormData?.shop_name ||
                            !shopFormData?.city_id)) ||
                        (editingCityId && !cityFormData?.city_name?.trim()) ||
                        (editingCountryId &&
                          !countryFormData?.country_name?.trim())
                      }
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>
      </div>
    );
  };

  return (
    <AdminDetailPanel
      open={!!target}
      title={panelTitle}
      onClose={handleCloseModal}
      footer={renderPanelFooter()}
      overlay={overlay}
    >
      {renderPanelBody()}
    </AdminDetailPanel>
  );
}
