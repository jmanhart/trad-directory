export interface ArtistLocation {
  city_name: string;
  state_name: string;
  country_name: string;
  shop_id?: number | null;
  shop_name?: string | null;
  shop_slug?: string | null;
  shop_instagram_handle?: string | null;
  is_primary: boolean;
}

export interface Artist {
  id: number;
  name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  is_traveling: boolean;
  created_at?: string | null;
  city_name: string;
  state_name: string;
  country_name: string;
  shop_id?: number | null;
  shop_name: string;
  shop_slug?: string | null;
  shop_instagram_handle?: string | null;
  locations: ArtistLocation[];
}

export interface Shop {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  address?: string | null;
  created_at?: string | null;
  city_name: string;
  state_name: string;
  country_name: string;
}

export interface ShopWithArtists extends Shop {
  artists: Artist[];
}

export interface City {
  id: number;
  city_name: string;
  state_name?: string | null;
  country_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
}

export interface Country {
  id: number;
  country_name: string;
  created_at?: string | null;
}
