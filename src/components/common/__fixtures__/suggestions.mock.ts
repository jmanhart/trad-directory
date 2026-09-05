import type { Suggestion } from "../../../utils/suggestions";

/**
 * Shared mock suggestions for Storybook — one source of truth so SearchBar,
 * SuggestionMenu, and SuggestionItem stories all render the same demo data.
 */
export const mockSuggestions: Suggestion[] = [
  { label: "Sailor Jerry", type: "artist", detail: "@sailorjerry", id: 1 },
  { label: "Ed Hardy", type: "artist", detail: "@edhardy", id: 2 },
  { label: "Kari Barba", type: "artist", detail: "@karibarba", id: 4 },
  { label: "Old Ironside Tattoo", type: "shop", detail: "Honolulu, HI", id: 10 },
  { label: "Outer Limits Tattoo", type: "shop", detail: "Anaheim, CA", id: 12 },
  { label: "Honolulu, Hawaii", type: "location", artistCount: 12 },
  { label: "Long Beach, California", type: "location", artistCount: 7 },
  { label: "Seattle, Washington", type: "location", artistCount: 24 },
  { label: "Sea Wolf Tattoo", type: "shop", detail: "Seattle, WA", id: 15 },
  { label: "Sean Casey", type: "artist", detail: "@casey_does_tattoos", id: 16 },
];
