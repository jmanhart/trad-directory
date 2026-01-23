import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./SearchBar.module.css";
import SearchIcon from "../../assets/icons/searchIcon";
import ArtistsIcon from "../../assets/icons/artistsIcon";
import ShopsIcon from "../../assets/icons/shopsIcon";
import GlobeIcon from "../../assets/icons/globeIcon";
import { type Suggestion } from "../../utils/suggestions";

type SearchBarSize = "small" | "medium" | "large";

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions: Suggestion[];
  onSelectSuggestion?: (suggestion: Suggestion) => void;
  size?: SearchBarSize;
  /** Enable debug mode for easier testing and styling */
  debug?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Keep suggestions dropdown open for styling/testing - prevents auto-close */
  keepOpen?: boolean;
}

/**
 * Centralized search bar component for artists, shops, and locations.
 * Features:
 * - Mobile-optimized touch interactions
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Debug mode for easier testing
 * - Grouped suggestions by type
 */
export default function SearchBar({
  onSearch,
  suggestions,
  onSelectSuggestion,
  size = "medium",
  debug = false,
  placeholder = "Search by artist, shop, city, or country...",
  keepOpen = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(keepOpen ? "test" : "");
  const [showSuggestions, setShowSuggestions] = useState(keepOpen);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Filter and group suggestions by type
  const filteredSuggestions = useMemo(() => {
    // If keepOpen is true, show all suggestions (or first 20 for performance)
    if (keepOpen && !query.trim()) {
      const allSuggestions = suggestions.slice(0, 20);
      const grouped: Record<string, Suggestion[]> = {
        artist: [],
        shop: [],
        location: [],
      };
      allSuggestions.forEach((suggestion) => {
        grouped[suggestion.type]?.push(suggestion);
      });
      return [
        ...grouped.artist,
        ...grouped.shop,
        ...grouped.location,
      ];
    }

    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().replace(/^@/, "");
    const filtered = suggestions.filter(
      (suggestion) =>
        suggestion.label.toLowerCase().includes(normalizedQuery) ||
        suggestion.detail?.toLowerCase().includes(normalizedQuery)
    );

    // Group by type for better organization
    const grouped: Record<string, Suggestion[]> = {
      artist: [],
      shop: [],
      location: [],
    };

    filtered.forEach((suggestion) => {
      grouped[suggestion.type]?.push(suggestion);
    });

    // Flatten with artists first, then shops, then locations
    return [
      ...grouped.artist,
      ...grouped.shop,
      ...grouped.location,
    ];
  }, [query, suggestions, keepOpen]);

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.debug("[SearchBar] State:", {
        query,
        suggestionsCount: filteredSuggestions.length,
        showSuggestions,
        highlightedIndex,
      });
    }
  }, [query, filteredSuggestions.length, showSuggestions, highlightedIndex, debug]);

  // Handle click outside to close suggestions (disabled when keepOpen is true)
  useEffect(() => {
    if (keepOpen) return; // Don't close when keepOpen is enabled

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    // Support both mouse and touch events for mobile
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [keepOpen]);

  // Auto-scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (keepOpen) {
      // Always show suggestions when keepOpen is true
      setShowSuggestions(true);
      setHighlightedIndex(filteredSuggestions.length > 0 ? 0 : -1);
    } else if (newQuery.trim()) {
      setShowSuggestions(true);
      setHighlightedIndex(filteredSuggestions.length > 0 ? 0 : -1);
    } else {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    if (debug) {
      console.debug("[SearchBar] Selected suggestion:", suggestion);
    }

    setQuery(suggestion.label);
    
    // Don't close if keepOpen is enabled
    if (!keepOpen) {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    } else {
      onSearch(suggestion.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp" && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        const index = highlightedIndex >= 0 ? highlightedIndex : 0;
        selectSuggestion(filteredSuggestions[index]);
      } else if (query.trim() !== "") {
        onSearch(query);
        setShowSuggestions(false);
      }
      return;
    }

    if (e.key === "Escape") {
      if (!keepOpen) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
      }
    }
  };

  const handleInputFocus = () => {
    if (query.trim() && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const sizeClass = styles[size] || "";
  const iconSizeClass =
    styles[`icon${size.charAt(0).toUpperCase() + size.slice(1)}`] || "";

  // Get suggestion type label for display
  const getTypeLabel = (type: Suggestion["type"]) => {
    switch (type) {
      case "artist":
        return "Artist";
      case "shop":
        return "Shop";
      case "location":
        return "Location";
      default:
        return "";
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "artist":
        return <ArtistsIcon className={styles.suggestionIcon} />;
      case "shop":
        return <ShopsIcon className={styles.suggestionIcon} />;
      case "location":
        return <GlobeIcon className={styles.suggestionIcon} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.searchBar} ${sizeClass} ${keepOpen ? styles.keepOpen : ""}`}
      ref={wrapperRef}
      data-debug={debug ? "true" : undefined}
      data-keep-open={keepOpen ? "true" : undefined}
      data-testid="search-bar"
    >
      <div className={styles.inputWrapper}>
        <span className={`${styles.icon} ${iconSizeClass}`} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={styles.input}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
          data-testid="search-input"
        />

        {(showSuggestions || keepOpen) && filteredSuggestions.length > 0 && (
          <ul
            id="search-suggestions"
            className={styles.suggestionsList}
            role="listbox"
            data-testid="search-suggestions"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.type}-${suggestion.id ?? suggestion.label}-${index}`}
                ref={(el) => {
                  if (el) suggestionRefs.current[index] = el;
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
                className={`${styles.suggestionItem} ${
                  index === highlightedIndex ? styles.highlighted : ""
                } ${styles[`suggestionType${suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}`]}`}
                role="option"
                aria-selected={index === highlightedIndex}
                data-suggestion-type={suggestion.type}
                data-suggestion-id={suggestion.id}
                data-testid={`suggestion-${suggestion.type}-${index}`}
              >
                <span className={styles.suggestionIconWrapper}>
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <span className={styles.suggestionLabel}>{suggestion.label}</span>
                {suggestion.detail && (
                  <span className={styles.suggestionDetail}>
                    {" "}
                    {suggestion.detail}
                  </span>
                )}
                {suggestion.type === "location" && suggestion.artistCount !== undefined && suggestion.artistCount > 0 && (
                  <span className={styles.suggestionArtistCount}>
                    {suggestion.artistCount} {suggestion.artistCount === 1 ? "artist" : "artists"}
                  </span>
                )}
                {debug && (
                  <span className={styles.suggestionTypeBadge}>
                    {getTypeLabel(suggestion.type)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
