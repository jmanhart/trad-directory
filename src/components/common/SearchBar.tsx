import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";
import SearchIcon from "../../assets/icons/searchIcon";

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions: {
    label: string;
    type: "artist" | "shop" | "location";
    detail?: string;
  }[];
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, suggestions }) => {
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    { label: string; type: string; detail?: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (query) {
      const normalizedQuery = query.toLowerCase().replace(/^@/, ""); // Normalize the query
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.label.toLowerCase().includes(normalizedQuery) ||
          suggestion.detail?.toLowerCase().includes(normalizedQuery)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
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

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim() !== "") {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredSuggestions.length
      ) {
        handleSelectSuggestion(filteredSuggestions[highlightedIndex].label);
      } else if (query.trim() !== "") {
        onSearch(query);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
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
          onKeyPress={handleKeyPress}
          placeholder="Search by artist, shop, city, or country..."
          className={styles.input}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.label}
              ref={(el) => {
                if (el) suggestionRefs.current[index] = el;
              }}
              onMouseDown={() => handleSelectSuggestion(suggestion.label)}
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
  );
};

export default SearchBar;
