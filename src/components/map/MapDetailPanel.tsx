import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getArtistUrl, getShopUrl } from "../../services/api";
import { Tabs } from "../common/Tabs";
import type { Artist } from "../../types/entities";
import type { CityDot } from "./MapView";
import styles from "./MapDetailPanel.module.css";

interface MapDetailPanelProps {
  title: string;
  subtitle?: string;
  variant: "city" | "region";
  artists: Artist[];
  shops: { id: number; shop_name: string; slug?: string | null }[];
  cityDots?: CityDot[];
  loading?: boolean;
  onClose: () => void;
  onCityClick?: (city: CityDot) => void;
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

type ShopEntry = { id: number; shop_name: string; slug?: string | null };

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
}: MapDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("artists");
  const [collapsedCities, setCollapsedCities] = useState<Set<string>>(
    new Set()
  );

  const hasTabs = shops.length > 0;

  const toggleCity = (cityName: string) => {
    setCollapsedCities(prev => {
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

  // Region stats
  const cityCount = cityDots?.length || 0;

  return (
    <div className={styles.card}>
      <div className={styles.dragHandle} />
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close"
        >
          &times;
        </button>
      </div>

      {variant === "region" ? (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{cityCount}</span>
            <span className={styles.statLabel}>
              {cityCount === 1 ? "City" : "Cities"}
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{artists.length}</span>
            <span className={styles.statLabel}>
              {artists.length === 1 ? "Artist" : "Artists"}
            </span>
          </div>
          {shops.length > 0 && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>{shops.length}</span>
                <span className={styles.statLabel}>
                  {shops.length === 1 ? "Shop" : "Shops"}
                </span>
              </div>
            </>
          )}
        </div>
      ) : hasTabs ? (
        <Tabs
          items={[
            { id: "artists", label: `Artists (${artists.length})` },
            { id: "shops", label: `Shops (${shops.length})` },
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

      {variant === "region" && hasTabs && (
        <Tabs
          items={[
            { id: "artists", label: `Artists (${artists.length})` },
            { id: "shops", label: `Shops (${shops.length})` },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className={styles.tabs}
        />
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
                <Link
                  key={artist.id}
                  to={getArtistUrl(artist)}
                  className={styles.listItem}
                >
                  <span className={styles.artistName}>{artist.name}</span>
                  {artist.instagram_handle && (
                    <span className={styles.handle}>
                      @{artist.instagram_handle}
                    </span>
                  )}
                </Link>
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
                const isCollapsed = collapsedCities.has(
                  `artists:${cityName}`
                );
                return (
                  <div key={cityName} className={styles.cityGroup}>
                    <button
                      className={styles.cityGroupHeader}
                      onClick={() => toggleCity(`artists:${cityName}`)}
                    >
                      <span className={styles.cityGroupLeft}>
                        <ChevronIcon
                          className={`${styles.cityGroupChevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
                        />
                        <span className={styles.cityGroupName}>
                          {cityName}
                        </span>
                      </span>
                      <span
                        className={styles.cityGroupCount}
                        onClick={e => {
                          if (group.dot) {
                            e.stopPropagation();
                            onCityClick?.(group.dot);
                          }
                        }}
                        title={
                          group.dot ? `View ${cityName}` : undefined
                        }
                      >
                        {group.artists.length}
                        {group.dot && (
                          <span className={styles.cityGroupArrow}>
                            &rsaquo;
                          </span>
                        )}
                      </span>
                    </button>
                    {!isCollapsed &&
                      group.artists.map(artist => (
                        <Link
                          key={artist.id}
                          to={getArtistUrl(artist)}
                          className={styles.listItem}
                        >
                          <span className={styles.artistName}>
                            {artist.name}
                          </span>
                          {artist.instagram_handle && (
                            <span className={styles.handle}>
                              @{artist.instagram_handle}
                            </span>
                          )}
                        </Link>
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
            <Link
              key={shop.id}
              to={getShopUrl(shop)}
              className={styles.listItem}
            >
              <span className={styles.shopName}>{shop.shop_name}</span>
            </Link>
          ))}

        {!loading &&
          hasTabs &&
          activeTab === "shops" &&
          variant === "region" &&
          shopsByCity &&
          shopsByCity.map(([cityName, group]) => {
            const isCollapsed = collapsedCities.has(`shops:${cityName}`);
            return (
              <div key={cityName} className={styles.cityGroup}>
                <button
                  className={styles.cityGroupHeader}
                  onClick={() => toggleCity(`shops:${cityName}`)}
                >
                  <span className={styles.cityGroupLeft}>
                    <span
                      className={`${styles.cityGroupChevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
                    >
                      &#9662;
                    </span>
                    <span className={styles.cityGroupName}>
                      {cityName}
                    </span>
                  </span>
                  <span
                    className={styles.cityGroupCount}
                    onClick={e => {
                      if (group.dot) {
                        e.stopPropagation();
                        onCityClick?.(group.dot);
                      }
                    }}
                    title={group.dot ? `View ${cityName}` : undefined}
                  >
                    {group.shops.length}
                    {group.dot && (
                      <span className={styles.cityGroupArrow}>
                        &rsaquo;
                      </span>
                    )}
                  </span>
                </button>
                {!isCollapsed &&
                  group.shops.map(shop => (
                    <Link
                      key={shop.id}
                      to={getShopUrl(shop)}
                      className={styles.listItem}
                    >
                      <span className={styles.shopName}>
                        {shop.shop_name}
                      </span>
                    </Link>
                  ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}
