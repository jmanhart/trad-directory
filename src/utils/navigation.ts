import { NavigateFunction } from "react-router-dom";

/**
 * Creates a navigation handler for search results
 */
export function createSearchHandler(navigate: NavigateFunction) {
  return (query: string) => {
    if (query.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query.trim())}`);
    }
  };
}

/**
 * Creates a click handler for pill items that navigates to search
 */
export function createPillClickHandler(
  navigate: NavigateFunction,
  searchTerm: string
) {
  return () => {
    navigate(`/search-results?q=${encodeURIComponent(searchTerm)}`);
  };
}

