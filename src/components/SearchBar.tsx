import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";

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

  useEffect(() => {
    if (query) {
      const normalizedQuery = query.toLowerCase().replace(/^@/, ""); // Normalize the query
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.label.toLowerCase().includes(normalizedQuery) ||
          suggestion.detail?.toLowerCase().includes(normalizedQuery) // Match detail (e.g., Instagram handle)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    onSearch(query);
    setShowSuggestions(false);
  };

  return (
    <div className={styles.searchBar} ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Search by artist, shop, city, or country..."
        className={styles.input}
      />
      <button onClick={handleSearch} className={styles.searchButton}>
        Search
      </button>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onMouseDown={() => handleSelectSuggestion(suggestion.label)}
              className={styles.suggestionItem}
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
