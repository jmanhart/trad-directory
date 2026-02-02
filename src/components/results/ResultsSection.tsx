import { useState } from "react";
import ArtistCard from "../artist/ArtistCard";
import ShopCard from "../shop/ShopCard";
import { Tabs } from "../common/Tabs";
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
}

export default function ResultsSection({
  artists,
  shops = [],
  hasSearched,
  showAllIfNoSearch = false,
  allArtists = [],
  allShops = [],
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
            <div className={styles.grid}>
              {artistsToDisplay.map(artist => (
                <ArtistCard key={`artist-${artist.id}`} artist={artist} />
              ))}
            </div>
          )}
          {activeTab === SHOPS_TAB_ID && (
            <div className={styles.grid}>
              {shopsToDisplay.map(shop => (
                <ShopCard key={`shop-${shop.id}`} shop={shop} />
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className={styles.resultsContainer}>
        {allArtists.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Artists</h2>
            <div className={styles.grid}>
              {allArtists.map(artist => (
                <ArtistCard key={`artist-${artist.id}`} artist={artist} />
              ))}
            </div>
          </>
        )}
        {allShops.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Shops</h2>
            <div className={styles.grid}>
              {allShops.map(shop => (
                <ShopCard key={`shop-${shop.id}`} shop={shop} />
              ))}
            </div>
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
          <div className={styles.grid}>
            {artistsToDisplay.map(artist => (
              <ArtistCard key={`artist-${artist.id}`} artist={artist} />
            ))}
          </div>
        )}
        {activeTab === SHOPS_TAB_ID && (
          <div className={styles.grid}>
            {shopsToDisplay.map(shop => (
              <ShopCard key={`shop-${shop.id}`} shop={shop} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      {hasArtists && (
        <div className={styles.grid}>
          {artistsToDisplay.map(artist => (
            <ArtistCard key={`artist-${artist.id}`} artist={artist} />
          ))}
        </div>
      )}
      {hasShops && (
        <div className={styles.grid}>
          {shopsToDisplay.map(shop => (
            <ShopCard key={`shop-${shop.id}`} shop={shop} />
          ))}
        </div>
      )}
      {!hasArtists && !hasShops && (
        <p className={styles.noResults}>No results found. Please try again.</p>
      )}
    </div>
  );
}
