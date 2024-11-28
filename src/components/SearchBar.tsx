import React, { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions: { label: string; type: "artist" | "shop" | "location" }[]; // Array of possible search terms
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, suggestions }) => {
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    { label: string; type: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions when the query changes
  useEffect(() => {
    if (query) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.label.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, suggestions]);

  // Close suggestions when clicking outside the component
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
    setShowSuggestions(false); // Close the suggestions list
    onSearch(suggestion); // Trigger the search callback
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(query);
      setShowSuggestions(false); // Close the suggestions list
    }
  };

  const handleSearch = () => {
    onSearch(query);
    setShowSuggestions(false); // Close the suggestions list
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
              {suggestion.label} ({suggestion.type})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
