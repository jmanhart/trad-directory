import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SearchBar from "./SearchBar";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import { type Suggestion } from "../../utils/suggestions";
import { trackSearch } from "../../utils/analytics";
import styles from "./Header.module.css";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isHomePage = location.pathname === "/";
  const showSearchBar = !isHomePage;

  // Use centralized search suggestions hook
  const { suggestions } = useSearchSuggestions({
    autoFetch: showSearchBar,
    debug: false,
  });

  const [nameToId, setNameToId] = useState<Map<string, number>>(new Map());
  const [handleToId, setHandleToId] = useState<Map<string, number>>(new Map());

  // Build lookup maps from suggestions
  useEffect(() => {
    const nameMap = new Map<string, number>();
    const handleMap = new Map<string, number>();

    suggestions.forEach((suggestion) => {
      if (suggestion.type === "artist" && suggestion.id) {
        nameMap.set(suggestion.label, suggestion.id);
        if (suggestion.detail?.startsWith("@")) {
          handleMap.set(suggestion.detail.slice(1), suggestion.id);
        }
      }
    });

    setNameToId(nameMap);
    setHandleToId(handleMap);
  }, [suggestions]);

  const handleHeaderSearch = (query: string) => {
    if (query.trim()) {
      trackSearch({
        search_term: query.trim(),
        search_location: 'header',
      });
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
          {false && user ? (
            <>
              <Link to="/saved" className={styles.navLink}>
                Saved
              </Link>
              <Link to="/account" className={styles.navLink}>
                Account
              </Link>
            </>
          ) : (
            false && (
              <Link to="/login" className={styles.navLink}>
                Sign In
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
