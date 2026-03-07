import { useState } from "react";
import ArtistCard from "../artist/ArtistCard";
import ArtistRow from "../artist/ArtistRow";
import ShopCard from "../shop/ShopCard";
import ShopRow from "../shop/ShopRow";
import { Tabs } from "../common/Tabs";
import type { ViewMode } from "../../hooks/useListControls";
import styles from "./ResultsSection.module.css";

const ARTISTS_TAB_ID = "artists";
const SHOPS_TAB_ID = "shops";

interface Artist {
  id: number;
  name: string;
  slug?: string | null;
  instagram_handle?: string;
  shop_name?: string;
  shop_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface Shop {
  id: number;
  shop_name: string;
  slug?: string | null;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface ResultsSectionProps {
  artists: Artist[];
  shops?: Shop[];
  hasSearched: boolean;
  showAllIfNoSearch?: boolean;
  allArtists?: Artist[];
  allShops?: Shop[];
  viewMode?: ViewMode;
}

function ArtistList({
  artists,
  viewMode = "grid",
}: {
  artists: Artist[];
  viewMode?: ViewMode;
}) {
  if (viewMode === "row") {
    return (
      <div className={styles.list}>
        {artists.map(artist => (
          <ArtistRow key={`artist-${artist.id}`} artist={artist} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.grid}>
      {artists.map(artist => (
        <ArtistCard key={`artist-${artist.id}`} artist={artist} />
      ))}
    </div>
  );
}

function ShopList({
  shops,
  viewMode = "grid",
}: {
  shops: Shop[];
  viewMode?: ViewMode;
}) {
  if (viewMode === "row") {
    return (
      <div className={styles.list}>
        {shops.map(shop => (
          <ShopRow key={`shop-${shop.id}`} shop={shop} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.grid}>
      {shops.map(shop => (
        <ShopCard key={`shop-${shop.id}`} shop={shop} />
      ))}
    </div>
  );
}

export default function ResultsSection({
  artists,
  shops = [],
  hasSearched,
  showAllIfNoSearch = false,
  allArtists = [],
  allShops = [],
  viewMode = "grid",
}: ResultsSectionProps) {
  const [activeTab, setActiveTab] = useState(ARTISTS_TAB_ID);

  if (!hasSearched && !showAllIfNoSearch) {
    return null;
  }

  const artistsToDisplay = hasSearched ? artists : allArtists;
  const shopsToDisplay = hasSearched ? shops : allShops;
  const hasArtists = artistsToDisplay.length > 0;
  const hasShops = shopsToDisplay.length > 0;

  const useTabs = hasArtists && hasShops;

  if (!hasSearched && showAllIfNoSearch) {
    if (useTabs) {
      const tabItems = [
        { id: ARTISTS_TAB_ID, label: `${artistsToDisplay.length} Artists` },
        { id: SHOPS_TAB_ID, label: `${shopsToDisplay.length} Shops` },
      ];
      return (
        <div className={styles.resultsContainer}>
          <Tabs
            items={tabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          {activeTab === ARTISTS_TAB_ID && (
            <ArtistList artists={artistsToDisplay} viewMode={viewMode} />
          )}
          {activeTab === SHOPS_TAB_ID && (
            <ShopList shops={shopsToDisplay} viewMode={viewMode} />
          )}
        </div>
      );
    }
    return (
      <div className={styles.resultsContainer}>
        {allArtists.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Artists</h2>
            <ArtistList artists={allArtists} viewMode={viewMode} />
          </>
        )}
        {allShops.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Shops</h2>
            <ShopList shops={allShops} viewMode={viewMode} />
          </>
        )}
      </div>
    );
  }

  if (useTabs) {
    const tabItems = [
      { id: ARTISTS_TAB_ID, label: `${artistsToDisplay.length} Artists` },
      { id: SHOPS_TAB_ID, label: `${shopsToDisplay.length} Shops` },
    ];
    return (
      <div className={styles.resultsContainer}>
        <Tabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {activeTab === ARTISTS_TAB_ID && (
          <ArtistList artists={artistsToDisplay} viewMode={viewMode} />
        )}
        {activeTab === SHOPS_TAB_ID && (
          <ShopList shops={shopsToDisplay} viewMode={viewMode} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      {hasArtists && (
        <ArtistList artists={artistsToDisplay} viewMode={viewMode} />
      )}
      {hasShops && (
        <ShopList shops={shopsToDisplay} viewMode={viewMode} />
      )}
      {!hasArtists && !hasShops && (
        <p className={styles.noResults}>No results found. Please try again.</p>
      )}
    </div>
  );
}
