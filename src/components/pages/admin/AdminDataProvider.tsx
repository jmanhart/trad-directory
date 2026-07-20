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

interface AdminDataContextValue {
  stats: AdminStats;
  badges: AdminBadges;
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

/**
 * Loads the high-level admin figures (entity totals + sidebar badges) once and
 * shares them across the admin layout. The per-page tables still load their own
 * rows for now; those move in here as each page is extracted.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [badges, setBadges] = useState<AdminBadges>(EMPTY_BADGES);
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
      setStats({
        totalArtists: (artists.artists || []).length,
        totalShops: (shops.shops || []).length,
        totalCities: (cities.cities || []).length,
        totalCountries: (countries.countries || []).length,
      });
      const newCount = (arr: { status?: string }[] | undefined) =>
        (arr || []).filter(s => s.status === "new").length;
      setBadges({
        newSubmissions: newCount(subs.submissions),
        newBugs: newCount(bugs.submissions),
        brokenLinks: (broken.brokenLinks || []).length,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AdminDataContext.Provider value={{ stats, badges, loading, refresh }}>
      {children}
    </AdminDataContext.Provider>
  );
}
