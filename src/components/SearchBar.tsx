import React, { useState, useEffect } from "react";
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

  const handleSearch = (query: string) => {
    console.log("Search query:", query); // Debugging log

    if (!artists.length) return;

    const lowerCaseQuery = query.toLowerCase();

    // Filter artists matching the query
    const filteredArtists = artists.filter(
      (artist) =>
        artist.name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.city_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.state_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.country_name?.toLowerCase().includes(lowerCaseQuery)
    );

    // Filter shops matching the query and deduplicate them
    const filteredShops = [
      ...new Map(
        artists
          .filter((artist) =>
            artist.shop_name?.toLowerCase().includes(lowerCaseQuery)
          )
          .map((artist) => [artist.shop_id, artist])
      ).values(),
    ];

    // Combine results, prioritizing shops if needed
    const combinedResults = [...filteredArtists, ...filteredShops];

    console.log("Filtered results:", combinedResults); // Debugging log
    setFilteredResults(combinedResults);
  };

  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Search by artist, shop, city, or country..."
      />
      <button onClick={handleSearch}>Search</button>
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
