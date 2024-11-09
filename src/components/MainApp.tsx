import React, { useState, useEffect } from "react";
import { fetchTattooShopsWithArtists } from "../services/api";
import SearchBar from "./SearchBar";
import ArtistList from "./ArtistList";
// import ShopList from "./ShopList";
import styles from "./MainApp.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
  shop_name?: string;
  shop_id?: number;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

// interface Shop {
//   id: number;
//   name: string;
//   address: string;
//   city_name?: string;
//   state_name?: string;
//   country_name?: string;
//   artists: Artist[];
// }

const MainApp: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  // const [shops, setShops] = useState<Shop[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  // const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getData() {
      try {
        const data = await fetchTattooShopsWithArtists();
        if (data) {
          console.log("Initial artists:", data); // Debugging log
          setArtists(data);
          // setShops([]); // Adjust as needed if you have shop data
          setFilteredArtists(data);
          // setFilteredShops([]); // Adjust as needed if you have shop data
        }
      } catch (error: any) {
        setError("Error fetching data.");
        console.error("Fetch error:", error);
      }
    }

    getData();
  }, []);

  const handleSearch = (query: string) => {
    console.log("Search query:", query); // Debugging log

    if (!artists.length) return;

    const lowerCaseQuery = query.toLowerCase();
    const filteredArtists = artists.filter(
      (artist) =>
        artist.name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.shop_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.city_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.state_name?.toLowerCase().includes(lowerCaseQuery) ||
        artist.country_name?.toLowerCase().includes(lowerCaseQuery)
    );

    console.log("Filtered artists:", filteredArtists); // Debugging log
    setFilteredArtists(filteredArtists);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tattoo Artist & Shop Directory</h1>
      {error && <p className={styles.error}>{error}</p>}
      <SearchBar
        onSearch={handleSearch}
        suggestions={[
          ...new Set([
            ...artists.map((artist) => artist.name),
            ...artists.map((artist) => artist.city_name).filter(Boolean),
            ...artists.map((artist) => artist.state_name).filter(Boolean),
            ...artists.map((artist) => artist.country_name).filter(Boolean),
          ]),
        ]}
      />
      <h2>Artists</h2>
      {filteredArtists.length > 0 ? (
        <ArtistList artists={filteredArtists} />
      ) : (
        <p>No artists found.</p>
      )}
    </div>
  );
};

export default MainApp;
