import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Message, MessageWithRetry, Input } from "./AdminFormComponents";
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

type TabType = "artists" | "shops" | "cities" | "countries" | "states";
type SortColumn = "id" | "name" | "instagram_handle" | "location" | "shop_name" | "is_traveling";
type SortDirection = "asc" | "desc";

export default function AdminAllData() {
  const [activeTab, setActiveTab] = useState<TabType>("artists");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    if (activeTab === "artists") {
      loadArtists();
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

  const formatLocation = (artist: Artist) => {
    const parts = [];
    if (artist.city_name) parts.push(artist.city_name);
    if (artist.state_name) parts.push(artist.state_name);
    if (artist.country_name) parts.push(artist.country_name);
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
            disabled
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
        {activeTab === "artists" && !loading && (
          <div className={styles.searchContainer}>
            <Input
              type="text"
              placeholder="Search artists by name, Instagram, location, shop, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <span className={styles.resultCount}>
                {filteredAndSortedArtists.length} of {artists.length} artists
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
              onRetry={loadArtists}
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedArtists.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyCell}>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab !== "artists" && (
            <div className={styles.comingSoon}>
              <p>Coming soon: {activeTab} table view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
