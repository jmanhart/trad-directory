import type { Artist, Shop } from "../../../types";

export type ArtistData = Pick<
  Artist,
  | "id"
  | "name"
  | "instagram_handle"
  | "city_name"
  | "state_name"
  | "country_name"
  | "shop_name"
  | "shop_instagram_handle"
>;

export type ShopData = Pick<
  Shop,
  | "id"
  | "shop_name"
  | "instagram_handle"
  | "address"
  | "city_name"
  | "state_name"
  | "country_name"
>;
