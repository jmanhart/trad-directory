/**
 * Shared utility functions for admin pages
 */

import { City, State } from "./adminTypes";

/**
 * Format city display name with state and country
 */
export function getCityDisplayName(city: City): string {
  const parts = [city.city_name];
  if (city.state_name) parts.push(city.state_name);
  if (city.country_name) parts.push(city.country_name);
  return parts.join(", ");
}

/**
 * Format state display name with country
 */
export function getStateDisplayName(state: State): string {
  if (state.country_name) {
    return `${state.state_name}, ${state.country_name}`;
  }
  return state.state_name;
}
