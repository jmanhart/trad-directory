import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface AdminStats {
  totalArtists: number;
  totalShops: number;
  totalCities: number;
  totalCountries: number;
}

interface AdminBadges {
  newSubmissions: number;
  newBugs: number;
  brokenLinks: number;
}

interface AdminHealth {
  brokenLinks: number;
  brokenLinksPct: number; // 0–100, share of IG profiles that are broken
  artistsMissingIg: number;
  artistsMissingLocation: number;
  emptyCities: number; // cities with no artists and no shops
  orphanedShops: number; // shops with no linked artists
  pendingSubmissions: number;
}

interface AdminDataContextValue {
  stats: AdminStats;
  badges: AdminBadges;
  health: AdminHealth;
  loading: boolean;
  refresh: () => void;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminDataContext() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error(
      "useAdminDataContext must be used within an AdminDataProvider"
    );
  }
  return ctx;
}

const baseUrl = import.meta.env.VITE_API_URL || "/api";
const authHeaders = {
  Authorization: `Bearer ${import.meta.env.VITE_ADMIN_PASSWORD || ""}`,
};

const EMPTY_STATS: AdminStats = {
  totalArtists: 0,
  totalShops: 0,
  totalCities: 0,
  totalCountries: 0,
};
const EMPTY_BADGES: AdminBadges = {
  newSubmissions: 0,
  newBugs: 0,
  brokenLinks: 0,
};
const EMPTY_HEALTH: AdminHealth = {
  brokenLinks: 0,
  brokenLinksPct: 0,
  artistsMissingIg: 0,
  artistsMissingLocation: 0,
  emptyCities: 0,
  orphanedShops: 0,
  pendingSubmissions: 0,
};

interface LocRow {
  city_name?: string | null;
  state_name?: string | null;
  country_name?: string | null;
}
interface ArtistRow extends LocRow {
  instagram_handle?: string | null;
  shop_name?: string | null;
}
interface ShopRow extends LocRow {
  instagram_handle?: string | null;
  shop_name?: string | null;
}

const norm = (v?: string | null) => (v || "").trim().toLowerCase();
const locKey = (r: LocRow) =>
  `${norm(r.city_name)}|${norm(r.state_name)}|${norm(r.country_name)}`;

/**
 * Loads the high-level admin figures (entity totals, sidebar badges, and
 * data-health metrics) once and shares them across the admin layout. All of it
 * is derived client-side from the same lists the pages use — no extra queries.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [badges, setBadges] = useState<AdminBadges>(EMPTY_BADGES);
  const [health, setHealth] = useState<AdminHealth>(EMPTY_HEALTH);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const getJson = (path: string, withAuth = false) =>
      fetch(`${baseUrl}/${path}`, withAuth ? { headers: authHeaders } : {})
        .then(r => (r.ok ? r.json() : {}))
        .catch(() => ({}));
    try {
      const [artists, shops, cities, countries, subs, bugs, broken] =
        await Promise.all([
          getJson("listAllArtists"),
          getJson("listAllShops"),
          getJson("listCities"),
          getJson("listCountries"),
          getJson("listSubmissions?type=new_artist", true),
          getJson("listSubmissions?type=report", true),
          getJson("listBrokenLinks", true),
        ]);

      const artistRows: ArtistRow[] = artists.artists || [];
      const shopRows: ShopRow[] = shops.shops || [];
      const cityRows: LocRow[] = cities.cities || [];
      const brokenRows: unknown[] = broken.brokenLinks || [];

      setStats({
        totalArtists: artistRows.length,
        totalShops: shopRows.length,
        totalCities: cityRows.length,
        totalCountries: (countries.countries || []).length,
      });

      const newCount = (arr: { status?: string }[] | undefined) =>
        (arr || []).filter(s => s.status === "new").length;
      const pendingSubmissions = newCount(subs.submissions);
      setBadges({
        newSubmissions: pendingSubmissions,
        newBugs: newCount(bugs.submissions),
        brokenLinks: brokenRows.length,
      });

      // --- Data-health metrics (all derived from the lists above) ---
      const populatedCities = new Set<string>();
      artistRows.forEach(a => populatedCities.add(locKey(a)));
      shopRows.forEach(s => populatedCities.add(locKey(s)));
      const shopsWithArtists = new Set(
        artistRows.map(a => norm(a.shop_name)).filter(Boolean)
      );
      const profilesWithIg =
        artistRows.filter(a => a.instagram_handle).length +
        shopRows.filter(s => s.instagram_handle).length;

      setHealth({
        brokenLinks: brokenRows.length,
        brokenLinksPct: profilesWithIg
          ? Math.round((brokenRows.length / profilesWithIg) * 100)
          : 0,
        artistsMissingIg: artistRows.filter(a => !a.instagram_handle).length,
        artistsMissingLocation: artistRows.filter(a => !a.city_name).length,
        emptyCities: cityRows.filter(c => !populatedCities.has(locKey(c)))
          .length,
        orphanedShops: shopRows.filter(
          s => !shopsWithArtists.has(norm(s.shop_name))
        ).length,
        pendingSubmissions,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AdminDataContext.Provider
      value={{ stats, badges, health, loading, refresh }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}
