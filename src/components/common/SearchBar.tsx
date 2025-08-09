import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";
import SearchIcon from "../../assets/icons/searchIcon";

type Suggestion = {
  label: string;
  type: "artist" | "shop" | "location";
  detail?: string;
  id?: number; // artist id or shop id when applicable
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions: Suggestion[];
  onSelectSuggestion?: (suggestion: Suggestion) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  suggestions,
  onSelectSuggestion,
}) => {
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (query) {
      const normalizedQuery = query.toLowerCase().replace(/^@/, "");
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.label.toLowerCase().includes(normalizedQuery) ||
          suggestion.detail?.toLowerCase().includes(normalizedQuery)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
      setHighlightedIndex(filtered.length ? 0 : -1);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }, [query, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const selectSuggestion = (s: Suggestion) => {
    // Debug selected suggestion payload
    // eslint-disable-next-line no-console
    console.debug("SearchBar selectSuggestion:", s);
    setQuery(s.label);
    setShowSuggestions(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(s);
    } else {
      onSearch(s.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "ArrowDown" &&
      showSuggestions &&
      filteredSuggestions.length > 0
    ) {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }
    if (
      e.key === "ArrowUp" &&
      showSuggestions &&
      filteredSuggestions.length > 0
    ) {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
      return;
    }
    if (e.key === "Enter") {
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
      setShowSuggestions(false);
    }
  };

  return (
    <div className={styles.searchBar} ref={wrapperRef}>
      <div className={styles.inputWrapper}>
        <span className={styles.icon}>
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search by artist, shop, city, or country..."
          className={styles.input}
          onKeyDown={handleKeyDown}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className={styles.suggestionsList}>
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.type}-${suggestion.id ?? suggestion.label}`}
                ref={(el) => {
                  if (el) suggestionRefs.current[index] = el;
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
                className={`${styles.suggestionItem} ${
                  index === highlightedIndex ? styles.highlighted : ""
                }`}
                id={`suggestion-${index}`}
              >
                {suggestion.label}
                {suggestion.detail && (
                  <span className={styles.detail}> ({suggestion.detail})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
