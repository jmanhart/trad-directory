import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Message,
  MessageWithRetry,
} from "./AdminFormComponents";
import { Tabs } from "../../common/Tabs";
import Pagination from "../../common/Pagination";
import {
  fetchCountries,
  updateSubmission,
  fetchBrokenLinks,
  fetchLinkStatuses,
  checkLink,
  type SubmissionStatus,
  type BrokenLinkResult,
  type LinkStatusMaps,
  type LinkStatusRec,
} from "../../../services/adminApi";
import { useAdminData } from "./useAdminData";
import SearchBar from "../../common/SearchBar";
import styles from "./AdminAllData.module.css";
import { StatusPill } from "./StatusPill";
import RecordEditor, { type EditorTarget } from "./RecordEditor";

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

  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);

  const {
    cities,
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

  const handleRetry = () => {
    if (activeTab === "artists") {
      loadArtists();
    } else if (activeTab === "shops") {
      loadShops();
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
    if (activeTab === "artists") setEditorTarget({ type: "artist", id });
    else if (activeTab === "shops") setEditorTarget({ type: "shop", id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeTab]);

  // Search control shared by the consolidated bar (compact) and the embedded
  // pages (full-width). Same value/onChange wiring; only the placeholder and
  // variant differ. Result count is intentionally omitted.
  const renderSearchControls = (compact: boolean) => {
    const searchable =
      activeTab === "artists" ||
      activeTab === "shops" ||
      activeTab === "cities" ||
      activeTab === "countries";
    if (!searchable || loading) return null;

    const placeholder = compact
      ? activeTab === "artists"
        ? "Search artists…"
        : activeTab === "shops"
          ? "Search shops…"
          : activeTab === "cities"
            ? "Search cities…"
            : "Search countries…"
      : activeTab === "artists"
        ? "Search artists by name, Instagram, location, shop, or ID..."
        : activeTab === "shops"
          ? "Search shops by name, Instagram, location, address, or ID..."
          : activeTab === "cities"
            ? "Search cities by name, state, or country..."
            : "Search countries by name or ID...";

    if (compact) {
      return (
        <div className={styles.headerSearch}>
          <SearchBar
            size="compact"
            value={searchQuery}
            onValueChange={setSearchQuery}
            suggestions={[]}
            placeholder={placeholder}
          />
        </div>
      );
    }
    return (
      <SearchBar
        size="medium"
        value={searchQuery}
        onValueChange={setSearchQuery}
        suggestions={[]}
        placeholder={placeholder}
      />
    );
  };

  return (
    <div
      className={`${styles.pageContainer} ${!embeddedTab ? styles.consolidated : ""}`}
    >
      <div className={styles.mainCol} ref={rootRef}>
        <div className={styles.container}>
        {embeddedTab && (
          <h1 className={styles.title}>{EMBEDDED_TITLES[embeddedTab]}</h1>
        )}
        {!embeddedTab && (
          <div className={styles.dataHeaderBar}>
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
            {renderSearchControls(true)}
          </div>
        )}

        {/* Embedded pages keep their full-width search below the title */}
        {embeddedTab && renderSearchControls(false)}

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
                          onClick={() => setEditorTarget({ type: "artist", id: artist.id })}
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
                          onClick={() => setEditorTarget({ type: "shop", id: shop.id })}
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
                          onClick={() => setEditorTarget({ type: "city", city })}
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
                        onClick={() => setEditorTarget({ type: "country", country })}
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
      <RecordEditor
        target={editorTarget}
        onClose={() => setEditorTarget(null)}
        onMutated={(t, action) => {
          if (t.type === "artist") {
            action === "deleted"
              ? setArtists(p => p.filter(a => a.id !== t.id))
              : loadArtists();
          } else if (t.type === "shop") {
            action === "deleted"
              ? setAllShops(p => p.filter(s => s.id !== t.id))
              : loadShops();
          } else if (t.type === "city") {
            refetchAdminData();
          } else {
            action === "deleted"
              ? setCountries(p => p.filter(c => c.id !== t.country.id))
              : loadStats();
          }
        }}
      />
    </div>
  );
}
