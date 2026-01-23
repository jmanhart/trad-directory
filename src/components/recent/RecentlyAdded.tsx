import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchRecentArtists, fetchRecentShops, fetchRecentCountries, fetchRecentCities } from "../../services/api";
import { formatRelativeTime } from "../../utils/relativeTime";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import InstagramLogoUrl from "/logo-instagram.svg";
import GlobeIcon from "../../assets/icons/globeIcon";
import styles from "./RecentlyAdded.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
  is_traveling?: boolean;
}

interface Shop {
  id: number;
  shop_name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
}

interface Country {
  id: number;
  country_name: string;
  created_at?: string | null;
}

interface City {
  id: number;
  city_name: string;
  state_name?: string | null;
  country_name?: string | null;
  created_at?: string | null;
}

// Unified feed item type
type FeedItemType = "artist" | "shop" | "location" | "country";

interface FeedItem {
  id: number;
  type: FeedItemType;
  name: string; // Artist name, shop name, or location name
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
  is_traveling?: boolean;
  // For sorting - timestamp from created_at if available, otherwise id (higher = newer)
  sortKey: number;
}

interface RecentlyAddedProps {
  limit?: number;
  includeLocations?: boolean; // Option to include/exclude locations and countries
}

export default function RecentlyAdded({ limit = 10, includeLocations = false }: RecentlyAddedProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecentlyAdded() {
      try {
        setIsLoading(true);
        const [artistsData, shopsData, countriesData, citiesData] = includeLocations
          ? await Promise.all([
              fetchRecentArtists(limit),
              fetchRecentShops(limit),
              fetchRecentCountries(limit),
              fetchRecentCities(limit),
            ])
          : [
              await fetchRecentArtists(limit),
              await fetchRecentShops(limit),
              [],
              [],
            ];

        const transformedArtists = artistsData.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          instagram_handle: artist.instagram_handle,
          city_name: artist.city_name || null,
          state_name: artist.state_name || null,
          country_name: artist.country_name || null,
          created_at: artist.created_at,
          is_traveling: artist.is_traveling || false,
        }));

        const transformedShops = shopsData.map((shop: any) => ({
          id: shop.id,
          shop_name: shop.shop_name,
          instagram_handle: shop.instagram_handle,
          city_name: shop.city_name || null,
          state_name: shop.state_name || null,
          country_name: shop.country_name || null,
          created_at: shop.created_at,
        }));

        const transformedCountries = countriesData.length > 0
          ? countriesData.map((country: any) => ({
              id: country.id,
              country_name: country.country_name,
              created_at: country.created_at,
            }))
          : [];

        const transformedCities = citiesData.length > 0
          ? citiesData.map((city: any) => ({
              id: city.id,
              city_name: city.city_name,
              state_name: city.state_name || null,
              country_name: city.country_name || null,
              created_at: city.created_at,
            }))
          : [];

        setArtists(transformedArtists);
        setShops(transformedShops);
        setCountries(transformedCountries);
        setCities(transformedCities);
      } catch (err) {
        console.error("Error loading recently added:", err);
        setError("Failed to load recently added");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentlyAdded();
  }, [limit]);

  // Merge and sort feed items by most recent first
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];

    // Add artists
    artists.forEach((artist) => {
      // Sort by created_at timestamp if available, otherwise use id (higher = newer)
      let sortKey: number;
      if (artist.created_at) {
        const timestamp = new Date(artist.created_at).getTime();
        sortKey = isNaN(timestamp) ? artist.id : timestamp;
      } else {
        sortKey = artist.id;
      }

      items.push({
        id: artist.id,
        type: "artist",
        name: artist.name,
        instagram_handle: artist.instagram_handle,
        city_name: artist.city_name,
        state_name: artist.state_name,
        country_name: artist.country_name,
        created_at: artist.created_at,
        is_traveling: artist.is_traveling,
        sortKey,
      });
    });

    // Add shops
    shops.forEach((shop) => {
      // Sort by created_at timestamp if available, otherwise use id (higher = newer)
      let sortKey: number;
      if (shop.created_at) {
        const timestamp = new Date(shop.created_at).getTime();
        sortKey = isNaN(timestamp) ? shop.id : timestamp;
      } else {
        sortKey = shop.id;
      }

      items.push({
        id: shop.id,
        type: "shop",
        name: shop.shop_name,
        instagram_handle: shop.instagram_handle,
        city_name: shop.city_name,
        state_name: shop.state_name,
        country_name: shop.country_name,
        created_at: shop.created_at,
        is_traveling: false,
        sortKey,
      });
    });

    // Add countries
    countries.forEach((country) => {
      // Sort by created_at timestamp if available, otherwise use id (higher = newer)
      let sortKey: number;
      if (country.created_at) {
        const timestamp = new Date(country.created_at).getTime();
        sortKey = isNaN(timestamp) ? country.id : timestamp;
      } else {
        sortKey = country.id;
      }

      items.push({
        id: country.id,
        type: "country",
        name: country.country_name,
        instagram_handle: null,
        city_name: null,
        state_name: null,
        country_name: country.country_name,
        created_at: country.created_at,
        is_traveling: false,
        sortKey,
      });
    });

    // Add cities
    cities.forEach((city) => {
      // Sort by created_at timestamp if available, otherwise use id (higher = newer)
      let sortKey: number;
      if (city.created_at) {
        const timestamp = new Date(city.created_at).getTime();
        sortKey = isNaN(timestamp) ? city.id : timestamp;
      } else {
        sortKey = city.id;
      }

      items.push({
        id: city.id,
        type: "location",
        name: city.city_name,
        instagram_handle: null,
        city_name: city.city_name,
        state_name: city.state_name,
        country_name: city.country_name,
        created_at: city.created_at,
        is_traveling: false,
        sortKey,
      });
    });

    // Sort by sortKey descending (most recent first) - all types together
    // This ensures the most recent items show up regardless of type
    const sorted = items.sort((a, b) => b.sortKey - a.sortKey);
    
    // Return the top 'limit' items, sorted by most recent first
    // This means if a city/country was just added, it will show up at the top
    return sorted.slice(0, limit);
  }, [artists, shops, countries, cities, limit]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.label}>Recently Added</h3>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  const getTypeLabel = (type: FeedItemType): string => {
    switch (type) {
      case "artist":
        return "ARTIST";
      case "shop":
        return "SHOP";
      case "location":
        return "LOCATION";
      case "country":
        return "COUNTRY";
      default:
        return "";
    }
  };

  const getItemUrl = (item: FeedItem): string => {
    switch (item.type) {
      case "artist":
        return `/artist/${item.id}`;
      case "shop":
        return `/shop/${item.id}`;
      case "location":
        // Future: city/location pages - for now, search by city name
        return `/?q=${encodeURIComponent(item.city_name || item.name)}`;
      case "country":
        // Future: country pages - for now, search by country name
        return `/?q=${encodeURIComponent(item.country_name || item.name)}`;
      default:
        return "#";
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>Recently Added</h3>
      <div className={styles.feed}>
        {feedItems.length === 0 ? (
          <p className={styles.empty}>No recent items</p>
        ) : (
          feedItems.map((item, index) => {
            const instagramUrl = item.instagram_handle
              ? `https://www.instagram.com/${item.instagram_handle}`
              : null;
            const itemUrl = getItemUrl(item);
            
            // For countries and cities, show the name directly without location formatting
            const displayLocation = item.type === "country" 
              ? null // Countries don't need location display
              : item.type === "location"
              ? formatArtistLocation({
                  city_name: item.city_name,
                  state_name: item.state_name,
                  country_name: item.country_name,
                  is_traveling: false,
                })
              : formatArtistLocation({
                  city_name: item.city_name,
                  state_name: item.state_name,
                  country_name: item.country_name,
                  is_traveling: item.is_traveling,
                });

            return (
              <React.Fragment key={`${item.type}-${item.id}`}>
                <Link to={itemUrl} className={styles.item}>
                  <div className={styles.content}>
                    {instagramUrl ? (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.instagramLink}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(instagramUrl, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <img
                          src={InstagramLogoUrl}
                          alt="Instagram"
                          className={styles.instagramIcon}
                        />
                      </a>
                    ) : item.type === "location" || item.type === "country" ? (
                      <GlobeIcon className={styles.globeIcon} />
                    ) : (
                      <span className={styles.iconPlaceholder} />
                    )}
                    <span className={styles.handle}>
                      {item.instagram_handle ? `@${item.instagram_handle}` : item.name}
                    </span>
                    {displayLocation && (
                      <span className={styles.city}>
                        {displayLocation}
                      </span>
                    )}
                    {item.created_at && (
                      <span className={styles.time}>
                        {formatRelativeTime(item.created_at)}
                      </span>
                    )}
                    <span className={styles.typeBadge}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                </Link>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
