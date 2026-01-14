/**
 * Shared type definitions for admin pages
 */

export interface City {
  id: number;
  city_name: string;
  state_id: number | null;
  state_name: string | null;
  country_id: number | null;
  country_name: string | null;
}

export interface Shop {
  id: number;
  shop_name: string;
}

export interface Artist {
  id: number;
  name: string;
  instagram_handle: string | null;
}

export interface State {
  id: number;
  state_name: string;
  country_id: number | null;
  country_name: string | null;
}

export type MessageType = {
  type: "success" | "error";
  text: string;
} | null;
