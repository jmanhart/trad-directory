export interface ArtistPageV2Artist {
  id: number;
  name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_id?: number | null;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}
