import { useState, useMemo } from "react";
import { Tabs } from "../common/Tabs";
import { CountBadge } from "../common/CountBadge";
import ShareMenu from "./ShareMenu";
import type { Artist } from "../../types/entities";
import type { CityDot } from "./MapView";
import styles from "./MapDetailPanel.module.css";

type ShopEntry = { id: number; shop_name: string; slug?: string | null };

interface MapDetailPanelProps {
  title: string;
  subtitle?: string;
  variant: "city" | "region";
  artists: Artist[];
  shops: ShopEntry[];
  cityDots?: CityDot[];
  loading?: boolean;
  onClose: () => void;
  onCityClick?: (city: CityDot) => void;
  onArtistClick?: (artist: Artist) => void;
  onShopClick?: (shop: ShopEntry) => void;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MapDetailPanel({
  title,
  subtitle,
  variant,
  artists,
  shops,
  cityDots,
  loading,
  onClose,
  onCityClick,
  onArtistClick,
  onShopClick,
}: MapDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("artists");
  const [expandedCities, setExpandedCities] = useState<Set<string>>(
    new Set()
  );

  const hasTabs = shops.length > 0;

  const toggleCity = (cityName: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(cityName)) {
        next.delete(cityName);
      } else {
        next.add(cityName);
      }
      return next;
    });
  };

  // Group artists by city for region variant
  const artistsByCity = useMemo(() => {
    if (variant !== "region") return null;
    const map = new Map<string, { dot: CityDot | null; artists: Artist[] }>();
    artists.forEach(artist => {
      const locations = artist.locations?.length
        ? artist.locations
        : [
            {
              city_name: artist.city_name,
              state_name: artist.state_name,
            },
          ];
      for (const loc of locations) {
        const cityName = loc.city_name || "Unknown";
        if (!map.has(cityName)) {
          const dot =
            cityDots?.find(
              d =>
                d.cityName === cityName &&
                d.stateName === (loc.state_name || null)
            ) || null;
          map.set(cityName, { dot, artists: [] });
        }
        map.get(cityName)!.artists.push(artist);
        break; // Only count each artist once
      }
    });
    // Sort cities A-Z, sort artists within each city A-Z
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cityName, group]) => [
        cityName,
        {
          ...group,
          artists: [...group.artists].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          ),
        },
      ]) as [string, { dot: CityDot | null; artists: Artist[] }][];
  }, [variant, artists, cityDots]);

  // Group shops by city for region variant
  const shopsByCity = useMemo(() => {
    if (variant !== "region") return null;
    const map = new Map<string, { dot: CityDot | null; shops: ShopEntry[] }>();
    artists.forEach(artist => {
      const locations = artist.locations?.length ? artist.locations : [];
      locations.forEach(loc => {
        if (!loc.shop_id || !loc.shop_name) return;
        const cityName = loc.city_name || "Unknown";
        if (!map.has(cityName)) {
          const dot =
            cityDots?.find(
              d =>
                d.cityName === cityName &&
                d.stateName === (loc.state_name || null)
            ) || null;
          map.set(cityName, { dot, shops: [] });
        }
        const group = map.get(cityName)!;
        if (!group.shops.some(s => s.id === loc.shop_id)) {
          group.shops.push({
            id: loc.shop_id,
            shop_name: loc.shop_name,
            slug: loc.shop_slug,
          });
        }
      });
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.shops.length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cityName, group]) => [
        cityName,
        {
          ...group,
          shops: [...group.shops].sort((a, b) =>
            a.shop_name.localeCompare(b.shop_name)
          ),
        },
      ]) as [string, { dot: CityDot | null; shops: ShopEntry[] }][];
  }, [variant, artists, cityDots]);

  return (
    <div className={styles.card}>
      <div className={styles.dragHandle} />
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headerActions}>
          <ShareMenu
            heading={`Traditional Tattoo Artists in ${title}`}
            artists={artists}
            className={styles.actionButton}
          />
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            &times;
          </button>
        </div>
      </div>

      {hasTabs ? (
        <Tabs
          items={[
            { id: "artists", label: "Artists", count: artists.length },
            { id: "shops", label: "Shops", count: shops.length },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className={styles.tabs}
        />
      ) : (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{artists.length}</span>
            <span className={styles.statLabel}>
              {artists.length === 1 ? "Artist" : "Artists"}
            </span>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {loading && (
          <div className={styles.loading}>Loading...</div>
        )}

        {!loading &&
          (!hasTabs || activeTab === "artists") &&
          variant === "city" && (
            <>
              {artists.length === 0 && (
                <div className={styles.loading}>
                  No artist details available
                </div>
              )}
              {artists.map(artist => (
                <button
                  key={artist.id}
                  className={styles.listItem}
                  onClick={() => onArtistClick?.(artist)}
                >
                  <span className={styles.artistName}>{artist.name}</span>
                  {artist.instagram_handle && (
                    <a
                      href={`https://instagram.com/${artist.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.handleLink}
                      onClick={e => e.stopPropagation()}
                    >
                      <span className={styles.handle}>
                        @{artist.instagram_handle}
                      </span>
                      <InstagramIcon className={styles.handleIcon} />
                    </a>
                  )}
                </button>
              ))}
            </>
          )}

        {!loading &&
          activeTab === "artists" &&
          variant === "region" &&
          artistsByCity && (
            <>
              {artistsByCity.length === 0 && (
                <div className={styles.loading}>
                  No artist details available
                </div>
              )}
              {artistsByCity.map(([cityName, group]) => {
                const isExpanded = expandedCities.has(
                  `artists:${cityName}`
                );
                return (
                  <div key={cityName} className={styles.cityGroup}>
                    <button
                      className={styles.cityGroupHeader}
                      onClick={() => {
                        toggleCity(`artists:${cityName}`);
                        if (group.dot) {
                          onCityClick?.(group.dot);
                        }
                      }}
                    >
                      <span className={styles.cityGroupLeft}>
                        <ChevronIcon
                          className={`${styles.cityGroupChevron} ${!isExpanded ? styles.chevronCollapsed : ""}`}
                        />
                        <span className={styles.cityGroupName}>
                          {cityName}
                        </span>
                      </span>
                      <span className={styles.cityGroupRight}>
                        <ShareMenu
                          heading={`Traditional Tattoo Artists in ${cityName}`}
                          artists={group.artists}
                          className={styles.cityAction}
                        />
                        <CountBadge count={group.artists.length} />
                      </span>
                    </button>
                    {isExpanded &&
                      group.artists.map(artist => (
                        <button
                          key={artist.id}
                          className={styles.listItem}
                          onClick={() => onArtistClick?.(artist)}
                        >
                          <span className={styles.artistName}>
                            {artist.name}
                          </span>
                          {artist.instagram_handle && (
                            <a
                              href={`https://instagram.com/${artist.instagram_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.handleLink}
                              onClick={e => e.stopPropagation()}
                            >
                              <InstagramIcon className={styles.handleIcon} />
                              <span className={styles.handle}>
                                @{artist.instagram_handle}
                              </span>
                            </a>
                          )}
                        </button>
                      ))}
                  </div>
                );
              })}
            </>
          )}

        {!loading &&
          hasTabs &&
          activeTab === "shops" &&
          variant === "city" &&
          shops.map(shop => (
            <button
              key={shop.id}
              className={styles.listItem}
              onClick={() => onShopClick?.(shop)}
            >
              <span className={styles.shopName}>{shop.shop_name}</span>
            </button>
          ))}

        {!loading &&
          hasTabs &&
          activeTab === "shops" &&
          variant === "region" &&
          shopsByCity &&
          shopsByCity.map(([cityName, group]) => {
            const isExpanded = expandedCities.has(`shops:${cityName}`);
            return (
              <div key={cityName} className={styles.cityGroup}>
                <button
                  className={styles.cityGroupHeader}
                  onClick={() => {
                    toggleCity(`shops:${cityName}`);
                    if (group.dot) {
                      onCityClick?.(group.dot);
                    }
                  }}
                >
                  <span className={styles.cityGroupLeft}>
                    <ChevronIcon
                      className={`${styles.cityGroupChevron} ${!isExpanded ? styles.chevronCollapsed : ""}`}
                    />
                    <span className={styles.cityGroupName}>
                      {cityName}
                    </span>
                  </span>
                  <CountBadge count={group.shops.length} />
                </button>
                {isExpanded &&
                  group.shops.map(shop => (
                    <button
                      key={shop.id}
                      className={styles.listItem}
                      onClick={() => onShopClick?.(shop)}
                    >
                      <span className={styles.shopName}>
                        {shop.shop_name}
                      </span>
                    </button>
                  ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}
