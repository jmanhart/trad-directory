import { useState } from "react";
import { Link } from "react-router-dom";
import { getArtistUrl, getShopUrl } from "../../services/api";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { Tabs } from "../common/Tabs";
import type { Artist } from "../../types/entities";
import styles from "./CityDetailCard.module.css";

interface CityDetailCardProps {
  cityName: string;
  stateName: string | null;
  countryName: string | null;
  artists: Artist[];
  shops: { id: number; shop_name: string; slug?: string | null }[];
  loading?: boolean;
  onClose: () => void;
}

export default function CityDetailCard({
  cityName,
  stateName,
  countryName,
  artists,
  shops,
  loading,
  onClose,
}: CityDetailCardProps) {
  const [activeTab, setActiveTab] = useState("artists");

  const location = formatArtistLocation({
    city_name: cityName,
    state_name: stateName,
    country_name: countryName,
  });

  const hasTabs = shops.length > 0;

  return (
    <div className={styles.card}>
      <div className={styles.dragHandle} />
      <div className={styles.header}>
        <div>
          <h2 className={styles.cityName}>{cityName}</h2>
          {(stateName || countryName) && (
            <p className={styles.location}>{location}</p>
          )}
        </div>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close"
        >
          &times;
        </button>
      </div>

      {hasTabs ? (
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

      <div className={styles.list}>
        {(!hasTabs || activeTab === "artists") && (
          <>
            {loading && (
              <div className={styles.loading}>Loading artists...</div>
            )}
            {!loading && artists.length === 0 && (
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
        {hasTabs &&
          activeTab === "shops" &&
          shops.map(shop => (
            <Link
              key={shop.id}
              to={getShopUrl(shop)}
              className={styles.listItem}
            >
              <span className={styles.shopName}>{shop.shop_name}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
