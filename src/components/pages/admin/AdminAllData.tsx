import { useState, useEffect, useMemo, useRef } from "react";
import { CONTINENT_OPTIONS } from "../../../types/entities";
import { useSearchParams } from "react-router-dom";
import {
  Message,
  MessageWithRetry,
  Input,
  FormGroup,
  Label,
  Select,
} from "./AdminFormComponents";
import { Tabs } from "../../common/Tabs";
import Pagination from "../../common/Pagination";
import {
  updateArtist,
  fetchArtistById,
  updateShop,
  fetchShopById,
  fetchCountries,
  updateCity,
  updateCountry,
  updateSubmission,
  fetchBrokenLinks,
  addArtistLocation,
  deleteArtistLocation,
  deleteArtist,
  deleteShop,
  fetchLinkStatuses,
  checkLink,
  deleteCity,
  deleteCountry,
  type SubmissionStatus,
  type BrokenLinkResult,
  type LinkStatusMaps,
  type LinkStatusRec,
} from "../../../services/adminApi";
import { useAdminData } from "./useAdminData";
import type { City } from "./adminTypes";
import { getCityDisplayName } from "./adminUtils";
import SearchIcon from "../../../assets/icons/searchIcon";
import styles from "./AdminAllData.module.css";
import AdminDetailPanel from "./AdminDetailPanel";

const STATUS_PILL_LABEL: Record<string, string> = {
  unchecked: "Unchecked",
  alive: "Alive",
  suspect: "Suspect",
  dead: "Dead",
  unknown: "Unknown",
};

function StatusPill({
  status,
  onClick,
  busy,
}: {
  status?: string;
  onClick?: () => void;
  busy?: boolean;
}) {
  const tone = status
    ? styles[`statusPill_${status}`]
    : styles.statusPill_unchecked;
  const label = busy
    ? "Checking…"
    : status
      ? STATUS_PILL_LABEL[status] ?? status
      : "—";
  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.statusPill} ${tone} ${styles.statusPillButton}`}
        disabled={busy}
        title="Run a live check"
        onClick={e => {
          e.stopPropagation();
          onClick();
        }}
      >
        {label}
      </button>
    );
  }
  if (!status) return <span className={styles.statusMuted}>—</span>;
  return (
    <span className={`${styles.statusPill} ${tone}`}>
      {STATUS_PILL_LABEL[status] ?? status}
    </span>
  );
}

function fmtHealthDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleDateString();
}

// Compact location for the dense table view: city in full, state + country
// abbreviated when known (e.g. "Seattle, WA, US"); unknown names fall back to
// full text so nothing is lost. The detail flyout keeps the full names.
const STATE_ABBR: Record<string, string> = {
  // United States
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "District of Columbia": "DC",
  // Canada
  Alberta: "AB", "British Columbia": "BC", Manitoba: "MB", "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL", "Northwest Territories": "NT",
  "Nova Scotia": "NS", Nunavut: "NU", Ontario: "ON", "Prince Edward Island": "PE",
  Quebec: "QC", Saskatchewan: "SK", Yukon: "YT",
  // Australia
  "New South Wales": "NSW", Victoria: "VIC", Queensland: "QLD",
  "Western Australia": "WA", "South Australia": "SA", Tasmania: "TAS",
  "Australian Capital Territory": "ACT", "Northern Territory": "NT",
};

const COUNTRY_ABBR: Record<string, string> = {
  "United States": "US", "United Kingdom": "UK", Canada: "CA", Australia: "AU",
  Germany: "DE", France: "FR", Netherlands: "NL", Spain: "ES", Italy: "IT",
  Ireland: "IE", "New Zealand": "NZ", Sweden: "SE", Norway: "NO", Denmark: "DK",
  Finland: "FI", Japan: "JP", Brazil: "BR", Mexico: "MX", Portugal: "PT",
  Belgium: "BE", Austria: "AT", Switzerland: "CH", Poland: "PL",
};

function shortLocation(
  city?: string | null,
  state?: string | null,
  country?: string | null
): string {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(STATE_ABBR[state] ?? state);
  if (country) parts.push(COUNTRY_ABBR[country] ?? country);
  return parts.length > 0 ? parts.join(", ") : "—";
}

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

interface CityFormData {
  city_name: string;
  state_id: string;
}


interface CountryFormData {
  country_name: string;
  continent: string;
}

type TabType =
  | "artists"
  | "shops"
  | "cities"
  | "countries"
  | "states"
  | "new_artists"
  | "bugs"
  | "broken_links";
type ArtistSortColumn =
  | "id"
  | "name"
  | "instagram_handle"
  | "location"
  | "shop_name"
  | "is_traveling";
type ShopSortColumn =
  | "id"
  | "shop_name"
  | "instagram_handle"
  | "location"
  | "address"
  | "shop_artist_count";
type CitySortColumn =
  | "city_name"
  | "state"
  | "country"
  | "city_artist_count"
  | "city_shop_count";
type CountrySortColumn =
  | "country_name"
  | "continent"
  | "country_city_count"
  | "country_artist_count"
  | "country_shop_count";
type SortColumn =
  | ArtistSortColumn
  | ShopSortColumn
  | CitySortColumn
  | CountrySortColumn;
type SortDirection = "asc" | "desc";

// Count columns default to descending ("most first") on first click.
const NUMERIC_SORT_COLUMNS = new Set<SortColumn>([
  "shop_artist_count",
  "city_artist_count",
  "city_shop_count",
  "country_city_count",
  "country_artist_count",
  "country_shop_count",
]);

// Each entity tab sorts by a sensible default; reset on tab switch so a sort
// column from another entity doesn't linger and leave the table unsorted.
const DEFAULT_SORT: Partial<Record<TabType, SortColumn>> = {
  artists: "id",
  shops: "id",
  cities: "city_name",
  countries: "country_name",
};

function formatSubmissionStatus(status: string | undefined): string {
  if (!status) return "—";
  const labels: Record<string, string> = {
    new: "New",
    added: "Added",
    deleted: "Deleted",
    in_progress: "In progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] ?? status;
}

function SubmissionActions({
  submission,
  updating,
  onUpdateStatus,
}: {
  submission: { id: string; status?: string };
  updating: boolean;
  onUpdateStatus: (id: string, status: SubmissionStatus) => Promise<void>;
}) {
  const status = (submission.status || "new") as SubmissionStatus;
  const isDeleted = status === "deleted";
  return (
    <div className={styles.submissionActions}>
      {!isDeleted && (
        <button
          type="button"
          className={styles.addedSubmissionButton}
          onClick={() => onUpdateStatus(submission.id, "added")}
          disabled={updating}
          title="Mark as Added (saved in database)"
        >
          {updating ? "…" : "Added"}
        </button>
      )}
      {!isDeleted && (
        <button
          type="button"
          className={styles.deleteSubmissionButton}
          onClick={() => onUpdateStatus(submission.id, "deleted")}
          disabled={updating}
          title="Remove from list (kept in database)"
        >
          {updating ? "…" : "Delete"}
        </button>
      )}
    </div>
  );
}

// Composite keys for client-side location counts (Option A — keyed on names,
// so same-named cities in different states/countries stay distinct).
const cityCountKey = (
  city?: string | null,
  state?: string | null,
  country?: string | null
) =>
  `${(city || "").toLowerCase()}|${(state || "").toLowerCase()}|${(
    country || ""
  ).toLowerCase()}`;
const countryCountKey = (country?: string | null) =>
  (country || "").toLowerCase();

interface AdminAllDataProps {
  // When set, renders just this one tab's content (used by the sidebar layout
  // pages) — hides the stats cards and Tabs bar, showing a per-page title.
  embeddedTab?: TabType;
}

const PAGE_SIZE = 50;
// Tabs whose tables get client-side pagination (the ones that can grow large).
const PAGINATED_TABS: TabType[] = ["artists", "shops", "cities", "countries"];

// Page titles shown when a tab is rendered as its own sidebar-layout page.
const EMBEDDED_TITLES: Record<TabType, string> = {
  artists: "ALL ARTISTS",
  shops: "ALL SHOPS",
  cities: "ALL CITIES",
  countries: "ALL COUNTRIES",
  states: "ALL STATES",
  new_artists: "SUBMISSIONS",
  bugs: "BUGS",
  broken_links: "BROKEN LINKS",
};

// Entity tabs shown in the consolidated /admin/data view (submissions, bugs,
// and broken links remain their own sidebar pages).
function isDataTab(value: string | null): value is TabType {
  return (
    value === "artists" ||
    value === "shops" ||
    value === "cities" ||
    value === "countries"
  );
}

export default function AdminAllData({ embeddedTab }: AdminAllDataProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(
    embeddedTab ?? (isDataTab(urlTab) ? urlTab : "artists")
  );

  // Embedded pages (submissions/bugs/broken-links) sync from the route prop;
  // the /admin/data view syncs from the ?tab= query param.
  useEffect(() => {
    if (embeddedTab) setActiveTab(embeddedTab);
    else if (isDataTab(urlTab)) setActiveTab(urlTab);
    else setActiveTab("artists");
  }, [embeddedTab, urlTab]);

  // In the /admin/data view, reflect the active tab in the URL for deep links.
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (!embeddedTab) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", tab);
      setSearchParams(next, { replace: true });
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);

  // The admin content scrolls in its own container (pinned layout), so on page
  // change scroll that container — not the window — back to the top.
  useEffect(() => {
    let el: HTMLElement | null = rootRef.current;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === "auto" || oy === "scroll") {
        el.scrollTop = 0;
        break;
      }
      el = el.parentElement;
    }
  }, [currentPage]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [countries, setCountries] = useState<
    { id: number; country_name: string; continent: string | null }[]
  >([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [brokenLinks, setBrokenLinks] = useState<BrokenLinkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: "error"; text: string } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const {
    cities,
    shops,
    states,
    loading: dataLoading,
    refetch: refetchAdminData,
  } = useAdminData({
    loadCities: true,
    loadShops: true,
    loadStates: true,
  });

  const [linkStatuses, setLinkStatuses] = useState<LinkStatusMaps>({
    artists: {},
    shops: {},
  });

  const [checkingLink, setCheckingLink] = useState<Record<string, boolean>>({});

  const runLinkCheck = async (entityType: "artist" | "shop", id: number) => {
    const key = `${entityType}:${id}`;
    setCheckingLink(c => ({ ...c, [key]: true }));
    try {
      const res = await checkLink(entityType, id);
      const rec: LinkStatusRec = {
        status: res.status,
        last_alive_at: res.last_alive_at,
        checked_at: res.checked_at,
        status_code: res.probe.statusCode,
        error_message: res.probe.result === "unknown" ? res.probe.detail : null,
      };
      setLinkStatuses(prev =>
        entityType === "artist"
          ? { ...prev, artists: { ...prev.artists, [id]: rec } }
          : { ...prev, shops: { ...prev.shops, [id]: rec } }
      );
    } catch (e) {
      console.error("link check failed", e);
    } finally {
      setCheckingLink(c => ({ ...c, [key]: false }));
    }
  };

  useEffect(() => {
    // Load stats and initial data on mount
    loadStats();
    loadArtists();
    loadShops(false); // Load shops silently for stats
    fetchLinkStatuses().then(setLinkStatuses).catch(() => {});
  }, []);

  useEffect(() => {
    const defaultSort = DEFAULT_SORT[activeTab];
    if (defaultSort) {
      setSortColumn(defaultSort);
      setSortDirection("asc");
    }
    // Reload data when switching tabs if needed
    if (activeTab === "artists" && artists.length === 0) {
      loadArtists();
    } else if (activeTab === "shops" && allShops.length === 0) {
      loadShops(true); // Show loading when on shops tab
    } else if (activeTab === "new_artists" || activeTab === "bugs") {
      // Always reload submissions when switching to these tabs to get latest data
      loadSubmissions();
    } else if (activeTab === "broken_links") {
      loadBrokenLinks();
    }
  }, [activeTab]);

  const loadBrokenLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBrokenLinks();
      setBrokenLinks(data);
    } catch (err) {
      setError({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to load broken links",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const type = activeTab === "new_artists" ? "new_artist" : "report";
      const baseUrl = import.meta.env.VITE_API_URL || "/api";
      const apiUrl = `${baseUrl}/listSubmissions?type=${type}`;

      console.log("Loading submissions:", { type, apiUrl });

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_ADMIN_PASSWORD || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Submissions loaded:", result.submissions?.length || 0);

      // Only update if we're still on the same tab
      if (activeTab === "new_artists" || activeTab === "bugs") {
        setSubmissions(result.submissions || []);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
      setError({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load submissions",
      });
      // Don't clear submissions on error, keep what we had
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const countriesData = await fetchCountries();
      setCountries(countriesData);
    } catch (err) {
      console.error("Error loading stats:", err);
      // Don't set error state for stats, just log it
    }
  };

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
          errorData.details ||
            errorData.error ||
            `Failed to fetch artists: ${response.status}`
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

  const loadShops = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      const apiUrl = import.meta.env.VITE_API_URL || "/api/listAllShops";
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details ||
            errorData.error ||
            `Failed to fetch shops: ${response.status}`
        );
      }

      const result = await response.json();
      setAllShops(result.shops || []);
    } catch (err) {
      if (showLoading) {
        setError({
          type: "error",
          text: `Failed to load shops: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
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
      filtered = artists.filter(artist => {
        const location = formatLocation(artist).toLowerCase();
        return (
          artist.name.toLowerCase().includes(query) ||
          (artist.instagram_handle &&
            artist.instagram_handle.toLowerCase().includes(query)) ||
          location.includes(query) ||
          (artist.shop_name &&
            artist.shop_name.toLowerCase().includes(query)) ||
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

  // Artists per shop (name-keyed), for the shops table count column.
  const artistCountByShop = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of artists) {
      const k = (a.shop_name || "").trim().toLowerCase();
      if (k) m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [artists]);

  // Filter and sort shops
  const filteredAndSortedShops = useMemo(() => {
    let filtered = allShops;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allShops.filter(shop => {
        const location = formatLocation(shop).toLowerCase();
        return (
          shop.shop_name.toLowerCase().includes(query) ||
          (shop.instagram_handle &&
            shop.instagram_handle.toLowerCase().includes(query)) ||
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
        case "shop_artist_count":
          aValue =
            artistCountByShop.get((a.shop_name || "").trim().toLowerCase()) || 0;
          bValue =
            artistCountByShop.get((b.shop_name || "").trim().toLowerCase()) || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    allShops,
    searchQuery,
    sortColumn,
    sortDirection,
    artistCountByShop,
  ]);

  // Client-side location counts (Option A). Counts each entity's PRIMARY
  // location only, keyed on name — upgrade to server-side counts if secondary
  // locations or same-name collisions ever matter. Defined before the
  // cities/countries memos so those can sort by these counts.
  const artistCountByCity = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of artists) {
      const k = cityCountKey(a.city_name, a.state_name, a.country_name);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [artists]);

  const shopCountByCity = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of allShops) {
      const k = cityCountKey(s.city_name, s.state_name, s.country_name);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [allShops]);

  const artistCountByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of artists) {
      const k = countryCountKey(a.country_name);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [artists]);

  const shopCountByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of allShops) {
      const k = countryCountKey(s.country_name);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [allShops]);

  const cityCountByCountry = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cities) {
      const k = countryCountKey(c.country_name);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [cities]);

  // Filter and sort cities (search + column sort, incl. count columns)
  const filteredAndSortedCities = useMemo(() => {
    let filtered = cities;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = cities.filter(
        city =>
          city.city_name.toLowerCase().includes(query) ||
          (city.state_name && city.state_name.toLowerCase().includes(query)) ||
          (city.country_name &&
            city.country_name.toLowerCase().includes(query)) ||
          city.id.toString().includes(query)
      );
    }
    return [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (sortColumn) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "state":
          aValue = (a.state_name || "").toLowerCase();
          bValue = (b.state_name || "").toLowerCase();
          break;
        case "country":
          aValue = (a.country_name || "").toLowerCase();
          bValue = (b.country_name || "").toLowerCase();
          break;
        case "city_artist_count":
          aValue =
            artistCountByCity.get(
              cityCountKey(a.city_name, a.state_name, a.country_name)
            ) || 0;
          bValue =
            artistCountByCity.get(
              cityCountKey(b.city_name, b.state_name, b.country_name)
            ) || 0;
          break;
        case "city_shop_count":
          aValue =
            shopCountByCity.get(
              cityCountKey(a.city_name, a.state_name, a.country_name)
            ) || 0;
          bValue =
            shopCountByCity.get(
              cityCountKey(b.city_name, b.state_name, b.country_name)
            ) || 0;
          break;
        case "city_name":
        default:
          aValue = a.city_name.toLowerCase();
          bValue = b.city_name.toLowerCase();
          break;
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    cities,
    searchQuery,
    sortColumn,
    sortDirection,
    artistCountByCity,
    shopCountByCity,
  ]);

  // Filter and sort countries (search + column sort, incl. count columns)
  const filteredAndSortedCountries = useMemo(() => {
    let filtered = countries;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = countries.filter(
        c =>
          c.country_name.toLowerCase().includes(query) ||
          c.id.toString().includes(query)
      );
    }
    return [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (sortColumn) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "continent":
          aValue = (a.continent || "").toLowerCase();
          bValue = (b.continent || "").toLowerCase();
          break;
        case "country_city_count":
          aValue = cityCountByCountry.get(countryCountKey(a.country_name)) || 0;
          bValue = cityCountByCountry.get(countryCountKey(b.country_name)) || 0;
          break;
        case "country_artist_count":
          aValue =
            artistCountByCountry.get(countryCountKey(a.country_name)) || 0;
          bValue =
            artistCountByCountry.get(countryCountKey(b.country_name)) || 0;
          break;
        case "country_shop_count":
          aValue = shopCountByCountry.get(countryCountKey(a.country_name)) || 0;
          bValue = shopCountByCountry.get(countryCountKey(b.country_name)) || 0;
          break;
        case "country_name":
        default:
          aValue = a.country_name.toLowerCase();
          bValue = b.country_name.toLowerCase();
          break;
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    countries,
    searchQuery,
    sortColumn,
    sortDirection,
    cityCountByCountry,
    artistCountByCountry,
    shopCountByCountry,
  ]);

  // Reset to the first page whenever the view (tab, search, or sort) changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortColumn, sortDirection]);

  const pageSlice = <T,>(rows: T[]): T[] =>
    rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilteredCount =
    activeTab === "artists"
      ? filteredAndSortedArtists.length
      : activeTab === "shops"
        ? filteredAndSortedShops.length
        : activeTab === "cities"
          ? filteredAndSortedCities.length
          : activeTab === "countries"
            ? filteredAndSortedCountries.length
            : 0;

  // Hide "deleted" submissions from the admin table (they stay in DB)
  const visibleSubmissions = useMemo(
    () =>
      submissions.filter((s: { status?: string }) => s.status !== "deleted"),
    [submissions]
  );

  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<
    string | null
  >(null);

  const handleUpdateSubmissionStatus = async (
    id: string,
    status: SubmissionStatus
  ) => {
    try {
      setUpdatingSubmissionId(id);
      await updateSubmission(id, status);
      await loadSubmissions();
    } catch (err) {
      console.error("Failed to update submission status:", err);
      setError({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to update submission",
      });
    } finally {
      setUpdatingSubmissionId(null);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(NUMERIC_SORT_COLUMNS.has(column) ? "desc" : "asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return "";
    return sortDirection === "asc" ? "↑" : "↓";
  };

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

  const handleEditCityClick = (city: City) => {
    setSaveError(null);
    clearPanelSelection();
    const formData: CityFormData = {
      city_name: city.city_name,
      state_id: city.state_id?.toString() || "",
    };
    setCityFormData(formData);
    setOriginalCityFormData(JSON.parse(JSON.stringify(formData)));
    setEditingCityId(city.id);
    setIsModalOpen(true);
    setPanelMode("view");
  };

  const handleEditCountryClick = (country: {
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
    setIsModalOpen(true);
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

  const handleRetry = () => {
    if (activeTab === "artists") {
      loadArtists();
    } else if (activeTab === "shops") {
      loadShops();
    }
  };

  const handleEditClick = async (artistId: number) => {
    setSaveError(null);
    clearPanelSelection();
    setEditingArtistId(artistId);
    setPanelMode("view");
    setIsModalOpen(true);
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
    setIsModalOpen(false);
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

  const handleEditShopClick = async (shopId: number) => {
    setSaveError(null);
    clearPanelSelection();
    setEditingShopId(shopId);
    setPanelMode("view");
    setIsModalOpen(true);
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

  // Deep-link from Link Health (/admin/data?tab=artists&edit=<id>): open that
  // record's edit panel, then drop the param so it doesn't reopen on close.
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const id = parseInt(editId, 10);
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
    if (Number.isNaN(id)) return;
    if (activeTab === "artists") handleEditClick(id);
    else if (activeTab === "shops") handleEditShopClick(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeTab]);

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
        setArtists(prev => prev.filter(a => a.id !== editingArtistId));
      } else if (editingShopId) {
        await deleteShop(editingShopId);
        setAllShops(prev => prev.filter(s => s.id !== editingShopId));
      } else if (editingCityId) {
        await deleteCity(editingCityId);
        await refetchAdminData();
      } else if (editingCountryId) {
        await deleteCountry(editingCountryId);
        setCountries(prev => prev.filter(c => c.id !== editingCountryId));
      }
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

        // Reload artists list
        await loadArtists();
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

        // Reload shops list
        await loadShops();
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
        await refetchAdminData();
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
        await loadStats();
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
    <div className={styles.pageContainer}>
      <div className={styles.mainCol} ref={rootRef}>
        <div className={styles.container}>
        {embeddedTab && (
          <h1 className={styles.title}>{EMBEDDED_TITLES[embeddedTab]}</h1>
        )}
        {!embeddedTab && (
          <>
            <h1 className={styles.title}>ALL DATA</h1>

            {/* Tabs */}
            <Tabs
              className={styles.dataTabs}
              items={[
                { id: "artists", label: "Artists" },
                { id: "shops", label: "Shops" },
                { id: "cities", label: "Cities" },
                { id: "countries", label: "Countries" },
              ]}
              activeTab={activeTab}
              onTabChange={tabId => handleTabChange(tabId as TabType)}
            />
          </>
        )}

        {/* Search Bar */}
        {(activeTab === "artists" ||
          activeTab === "shops" ||
          activeTab === "cities" ||
          activeTab === "countries") &&
          !loading && (
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <SearchIcon className={styles.searchIcon} aria-hidden />
                <Input
                  type="text"
                  placeholder={
                    activeTab === "artists"
                      ? "Search artists by name, Instagram, location, shop, or ID..."
                      : activeTab === "shops"
                        ? "Search shops by name, Instagram, location, address, or ID..."
                        : activeTab === "cities"
                          ? "Search cities by name, state, or country..."
                          : "Search countries by name or ID..."
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              {searchQuery && (
                <span className={styles.resultCount}>
                  {activeTab === "artists"
                    ? `${filteredAndSortedArtists.length} of ${artists.length} artists`
                    : activeTab === "shops"
                      ? `${filteredAndSortedShops.length} of ${allShops.length} shops`
                      : activeTab === "cities"
                        ? `${filteredAndSortedCities.length} of ${cities.length} cities`
                        : `${filteredAndSortedCountries.length} of ${countries.length} countries`}
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
                      <th>Status</th>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedArtists.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.emptyCell}>
                          {searchQuery
                            ? "No artists match your search"
                            : "No artists found"}
                        </td>
                      </tr>
                    ) : (
                      pageSlice(filteredAndSortedArtists).map(artist => (
                        <tr
                          key={artist.id}
                          className={styles.clickableRow}
                          onClick={() => handleEditClick(artist.id)}
                        >
                          <td className={styles.idCell}>{artist.id}</td>
                          <td className={styles.nameCell}>{artist.name}</td>
                          <td className={styles.instagramCell}>
                            {artist.instagram_handle ? (
                              <a
                                href={`https://instagram.com/${artist.instagram_handle.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                                onClick={e => e.stopPropagation()}
                              >
                                {artist.instagram_handle}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={styles.statusCell}>
                            <StatusPill
                              status={linkStatuses.artists[artist.id]?.status}
                              busy={checkingLink[`artist:${artist.id}`]}
                              onClick={() => runLinkCheck("artist", artist.id)}
                            />
                          </td>
                          <td className={styles.locationCell}>
                            <span className={styles.ellipsisCell}>
                              {shortLocation(
                                artist.city_name,
                                artist.state_name,
                                artist.country_name
                              )}
                            </span>
                          </td>
                          <td className={styles.shopCell}>
                            <span className={styles.shopEllipsis}>
                              {artist.shop_name || "—"}
                            </span>
                          </td>
                          <td className={styles.travelingCell}>
                            {artist.is_traveling ? "✓" : "—"}
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
                      <th>Status</th>
                      <th
                        className={styles.sortableHeader}
                        onClick={() => handleSort("location")}
                      >
                        Location {getSortIcon("location")}
                      </th>
                      <th
                        className={styles.sortableHeader}
                        onClick={() => handleSort("shop_artist_count")}
                      >
                        Artists {getSortIcon("shop_artist_count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedShops.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.emptyCell}>
                          {searchQuery
                            ? "No shops match your search"
                            : "No shops found"}
                        </td>
                      </tr>
                    ) : (
                      pageSlice(filteredAndSortedShops).map(shop => (
                        <tr
                          key={shop.id}
                          className={styles.clickableRow}
                          onClick={() => handleEditShopClick(shop.id)}
                        >
                          <td className={styles.idCell}>{shop.id}</td>
                          <td className={styles.nameCell}>{shop.shop_name}</td>
                          <td className={styles.instagramCell}>
                            {shop.instagram_handle ? (
                              <a
                                href={`https://instagram.com/${shop.instagram_handle.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                                onClick={e => e.stopPropagation()}
                              >
                                {shop.instagram_handle}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={styles.statusCell}>
                            <StatusPill
                              status={linkStatuses.shops[shop.id]?.status}
                              busy={checkingLink[`shop:${shop.id}`]}
                              onClick={() => runLinkCheck("shop", shop.id)}
                            />
                          </td>
                          <td className={styles.locationCell}>
                            <span className={styles.ellipsisCell}>
                              {shortLocation(
                                shop.city_name,
                                shop.state_name,
                                shop.country_name
                              )}
                            </span>
                          </td>
                          <td className={styles.numCell}>
                            {artistCountByShop.get(
                              (shop.shop_name || "").trim().toLowerCase()
                            ) || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "cities" && (
            <div className={styles.tableWrapper}>
              {dataLoading ? (
                <div className={styles.loading}>Loading cities...</div>
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
                        onClick={() => handleSort("city_name")}
                      >
                        City {getSortIcon("city_name")}
                      </th>
                      <th
                        className={styles.sortableHeader}
                        onClick={() => handleSort("state")}
                      >
                        State {getSortIcon("state")}
                      </th>
                      <th
                        className={styles.sortableHeader}
                        onClick={() => handleSort("country")}
                      >
                        Country {getSortIcon("country")}
                      </th>
                      <th
                        className={styles.sortableHeader}
                        onClick={() => handleSort("city_artist_count")}
                      >
                        Artists {getSortIcon("city_artist_count")}
                      </th>
                      <th
                        className={styles.sortableHeader}
                        onClick={() => handleSort("city_shop_count")}
                      >
                        Shops {getSortIcon("city_shop_count")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedCities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.emptyCell}>
                          {searchQuery
                            ? "No cities match your search"
                            : "No cities found"}
                        </td>
                      </tr>
                    ) : (
                      pageSlice(filteredAndSortedCities).map(city => (
                        <tr
                          key={city.id}
                          className={styles.clickableRow}
                          onClick={() => handleEditCityClick(city)}
                        >
                          <td className={styles.idCell}>{city.id}</td>
                          <td className={styles.nameCell}>{city.city_name}</td>
                          <td className={styles.locationCell}>
                            {city.state_name || "—"}
                          </td>
                          <td className={styles.locationCell}>
                            {city.country_name || "—"}
                          </td>
                          <td className={styles.numCell}>
                            {artistCountByCity.get(
                              cityCountKey(
                                city.city_name,
                                city.state_name,
                                city.country_name
                              )
                            ) || 0}
                          </td>
                          <td className={styles.numCell}>
                            {shopCountByCity.get(
                              cityCountKey(
                                city.city_name,
                                city.state_name,
                                city.country_name
                              )
                            ) || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "countries" && (
            <div className={styles.tableWrapper}>
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
                      onClick={() => handleSort("country_name")}
                    >
                      Country {getSortIcon("country_name")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("continent")}
                    >
                      Continent {getSortIcon("continent")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("country_city_count")}
                    >
                      Cities {getSortIcon("country_city_count")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("country_artist_count")}
                    >
                      Artists {getSortIcon("country_artist_count")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("country_shop_count")}
                    >
                      Shops {getSortIcon("country_shop_count")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCountries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>
                        {searchQuery
                          ? "No countries match your search"
                          : "No countries found"}
                      </td>
                    </tr>
                  ) : (
                    pageSlice(filteredAndSortedCountries).map(country => (
                      <tr
                        key={country.id}
                        className={styles.clickableRow}
                        onClick={() => handleEditCountryClick(country)}
                      >
                        <td className={styles.idCell}>{country.id}</td>
                        <td className={styles.nameCell}>
                          {country.country_name}
                        </td>
                        <td className={styles.locationCell}>
                          {country.continent || "—"}
                        </td>
                        <td className={styles.numCell}>
                          {cityCountByCountry.get(
                            countryCountKey(country.country_name)
                          ) || 0}
                        </td>
                        <td className={styles.numCell}>
                          {artistCountByCountry.get(
                            countryCountKey(country.country_name)
                          ) || 0}
                        </td>
                        <td className={styles.numCell}>
                          {shopCountByCountry.get(
                            countryCountKey(country.country_name)
                          ) || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {PAGINATED_TABS.includes(activeTab) && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(activeFilteredCount / PAGE_SIZE)}
              onPageChange={setCurrentPage}
            />
          )}

          {(activeTab === "new_artists" || activeTab === "bugs") && (
            <div className={styles.tableWrapper}>
              {loading ? (
                <div className={styles.loading}>Loading submissions...</div>
              ) : error ? (
                <Message type="error" text={error.text} />
              ) : visibleSubmissions.length === 0 ? (
                <div className={styles.emptyCell}>
                  No {activeTab === "new_artists" ? "new artist" : "bug"}{" "}
                  submissions yet.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.idCell}>ID</th>
                      <th className={styles.nameCell}>Date</th>
                      {activeTab === "new_artists" ? (
                        <>
                          <th>Name</th>
                          <th>Instagram</th>
                          <th>Location</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th className={styles.actionHeader} aria-label="Actions"></th>
                        </>
                      ) : (
                        <>
                          <th>Entity</th>
                          <th>Changes</th>
                          <th>Details</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th className={styles.actionHeader} aria-label="Actions"></th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSubmissions.map(submission => (
                      <tr key={submission.id}>
                        <td className={styles.idCell}>
                          {submission.id.substring(0, 8)}...
                        </td>
                        <td className={styles.nameCell}>
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        {activeTab === "new_artists" ? (
                          <>
                            <td>{submission.artist_name || "—"}</td>
                            <td>
                              {submission.artist_instagram_handle ? (
                                <a
                                  href={`https://instagram.com/${submission.artist_instagram_handle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.link}
                                >
                                  @{submission.artist_instagram_handle}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {[
                                submission.artist_city,
                                submission.artist_state,
                                submission.artist_country,
                              ]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </td>
                            <td>{submission.reporter_email || "—"}</td>
                            <td>
                              <span
                                className={styles.statusBadge}
                                data-status={submission.status}
                              >
                                {formatSubmissionStatus(submission.status)}
                              </span>
                            </td>
                            <td className={styles.actionCell}>
                              <SubmissionActions
                                submission={submission}
                                updating={
                                  updatingSubmissionId === submission.id
                                }
                                onUpdateStatus={handleUpdateSubmissionStatus}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              {submission.entity_type} #{submission.entity_id}
                            </td>
                            <td className={styles.detailsCell}>
                              {submission.details ? (
                                <div className={styles.detailsPreview}>
                                  {submission.details.substring(0, 100)}
                                  {submission.details.length > 100 ? "..." : ""}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className={styles.detailsCell}>
                              {submission.details || "—"}
                            </td>
                            <td>{submission.reporter_email || "—"}</td>
                            <td>
                              <span
                                className={styles.statusBadge}
                                data-status={submission.status}
                              >
                                {formatSubmissionStatus(submission.status)}
                              </span>
                            </td>
                            <td className={styles.actionCell}>
                              <SubmissionActions
                                submission={submission}
                                updating={
                                  updatingSubmissionId === submission.id
                                }
                                onUpdateStatus={handleUpdateSubmissionStatus}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "broken_links" && (
            <div className={styles.tableWrapper}>
              {loading ? (
                <div className={styles.loading}>Loading broken links...</div>
              ) : brokenLinks.length === 0 ? (
                <div className={styles.emptyCell}>No broken links found.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Instagram</th>
                      <th>Status</th>
                      <th>Error</th>
                      <th>Last Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokenLinks.map((link, idx) => (
                      <tr key={`${link.entity_type}-${link.entity_id}-${idx}`}>
                        <td className={styles.nameCell}>
                          {link.entity_type === "artist" ? "Artist" : "Shop"}
                        </td>
                        <td className={styles.nameCell}>{link.entity_name}</td>
                        <td className={styles.instagramCell}>
                          <a
                            href={`https://instagram.com/${link.instagram_handle.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                          >
                            @{link.instagram_handle.replace("@", "")}
                          </a>
                        </td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            data-status="broken"
                          >
                            {link.status_code ?? "N/A"}
                          </span>
                        </td>
                        <td className={styles.detailsCell}>
                          {link.error_message || "—"}
                        </td>
                        <td>
                          {new Date(link.checked_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab !== "artists" &&
            activeTab !== "shops" &&
            activeTab !== "cities" &&
            activeTab !== "countries" &&
            activeTab !== "new_artists" &&
            activeTab !== "bugs" &&
            activeTab !== "broken_links" && (
              <div className={styles.comingSoon}>
                <p>Coming soon: {activeTab} table view</p>
              </div>
            )}
        </div>
      </div>
      </div>
      <AdminDetailPanel
        open={isModalOpen}
        title={panelTitle}
        onClose={handleCloseModal}
        footer={renderPanelFooter()}
      >
        {renderPanelBody()}
      </AdminDetailPanel>
    </div>
  );
}
