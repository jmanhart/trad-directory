export interface ArtistData {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}

export interface ShopData {
  id: number;
  shop_name: string;
  instagram_handle?: string | null;
  address?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}
