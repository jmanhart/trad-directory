import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SearchBar from "./SearchBar";
import styles from "./Header.module.css";

interface Suggestion {
  label: string;
  type: "artist" | "shop" | "location";
  detail?: string;
  id?: number;
}

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [nameToId, setNameToId] = useState<Map<string, number>>(new Map());
  const [handleToId, setHandleToId] = useState<Map<string, number>>(new Map());

  // Ref to prevent duplicate API calls
  const hasFetchedSuggestions = useRef(false);

  const isHomePage = location.pathname === "/";
  const showSearchBar = !isHomePage;

  useEffect(() => {
    if (showSearchBar && !hasFetchedSuggestions.current) {
      hasFetchedSuggestions.current = true;
      fetchSuggestions();
    }
  }, [showSearchBar]);

  const fetchSuggestions = async () => {
    try {
      const { fetchTattooShopsWithArtists } = await import(
        "../../services/api"
      );
      const data = await fetchTattooShopsWithArtists();

      if (data) {
        const artistSuggestions: Suggestion[] = data.map((artist: any) => ({
          label: artist.name,
          type: "artist" as const,
          detail: artist?.instagram_handle ? `@${artist.instagram_handle}` : "",
          id: artist.id,
        }));

        const shopSuggestions: Suggestion[] = Array.from(
          new Set(
            data
              .filter((a: any) => a.shop_name && a.shop_name !== "N/A")
              .map((a: any) => a.shop_name as string)
          )
        ).map((name) => ({ label: name, type: "shop" as const }));

        const locationSuggestions: Suggestion[] = Array.from(
          new Set(
            data.flatMap((a: any) => [
              a.city_name,
              a.state_name,
              a.country_name,
            ])
          )
        )
          .filter(Boolean)
          .map((location) => ({
            label: location as string,
            type: "location" as const,
          }));

        setSuggestions([
          ...artistSuggestions,
          ...shopSuggestions,
          ...locationSuggestions,
        ]);

        // Build fast lookup maps
        const nameMap = new Map<string, number>();
        const handleMap = new Map<string, number>();
        for (const a of data) {
          if (a.name) nameMap.set(a.name, a.id);
          if (a.instagram_handle)
            handleMap.set(String(a.instagram_handle), a.id);
        }
        setNameToId(nameMap);
        setHandleToId(handleMap);
      }
    } catch (error) {
      console.error("Error fetching suggestions for header search:", error);
    }
  };

  const handleHeaderSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = async (s: Suggestion) => {
    if (s.type === "artist") {
      let id = s.id;
      if (!id) {
        id = nameToId.get(s.label);
      }
      if (!id && s.detail?.startsWith("@")) {
        id = handleToId.get(s.detail.slice(1));
      }
      if (!id) {
        try {
          const { fetchTattooShopsWithArtists } = await import(
            "../../services/api"
          );
          const data = await fetchTattooShopsWithArtists();
          const byName = data.find((a: any) => a.name === s.label)?.id;
          const byHandle = s.detail?.startsWith("@")
            ? data.find((a: any) => a.instagram_handle === s.detail!.slice(1))
                ?.id
            : undefined;
          id = byName ?? byHandle;
        } catch {
          // ignore
        }
      }
      if (id) {
        navigate(`/artist/${id}`, {
          state: {
            fromSearch: true,
            previous: location.pathname + (location.search || ""),
          },
        });
        return;
      }
    }
    handleHeaderSearch(s.label);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <Link to="/">Trad Tattoo Directory</Link>
        </div>

        {showSearchBar && (
          <div className={styles.headerSearch}>
            <SearchBar
              onSearch={handleHeaderSearch}
              suggestions={suggestions}
              onSelectSuggestion={handleSelectSuggestion}
            />
          </div>
        )}

        <nav className={styles.nav}>
          <Link to="/about" className={styles.navLink}>
            About
          </Link>
          <a
            href="https://www.instagram.com/trad_tattoo_directory/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
          >
            Instagram
          </a>
          {user ? (
            <>
              <Link to="/saved" className={styles.navLink}>
                Saved
              </Link>
              <Link to="/account" className={styles.navLink}>
                Account
              </Link>
            </>
          ) : (
            <Link to="/login" className={styles.navLink}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
