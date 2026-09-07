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

export const CONTINENT_OPTIONS = [
  "North America",
  "Central America",
  "South America",
  "Europe",
  "Asia",
  "Oceania",
  "Africa",
] as const;

export interface Country {
  id: number;
  country_name: string;
  continent?: string | null;
  created_at?: string | null;
}

export interface BigCartelStore {
  /** BigCartel store subdomain, e.g. "noahlockhart" for noahlockhart.bigcartel.com */
  subdomain: string;
  /** Canonical storefront URL. */
  storeUrl: string;
  /** Display name (artist or studio). */
  name: string;
  /** Whether the store is linked from an artist or a tattoo shop. */
  kind: "artist" | "shop";
  /** Internal directory profile path (/artist/... or /shop/...), if known. */
  profilePath: string | null;
}

export type ProductType =
  | "apparel"
  | "art"
  | "accessories"
  | "other";

export interface StoreProduct {
  id: number;
  name: string;
  /** Price in the store's currency, major units (e.g. dollars). */
  price: number;
  onSale: boolean;
  imageUrl: string | null;
  /** Absolute URL to the product page on BigCartel. */
  productUrl: string;
  soldOut: boolean;
  /** ISO timestamp the product was created, for "newest" sorting. */
  createdAt: string | null;
  /** Canonical product bucket for cross-store filtering. */
  type: ProductType;
}

export interface StoreProductWithStore extends StoreProduct {
  storeName: string;
  storeKind: "artist" | "shop";
  storeSubdomain: string;
  storeProfilePath: string | null;
}
