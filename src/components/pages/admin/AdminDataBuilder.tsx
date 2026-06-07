import { useState, useEffect } from "react";
import { useAdminData } from "./useAdminData";
import { fetchCountries } from "../../../services/adminApi";
import DataBuilder from "./DataBuilder";
import styles from "./AdminDataBuilder.module.css";

interface ArtistRow {
  id: number;
  name: string;
  instagram_handle: string | null;
  city_name: string | null;
  state_name: string | null;
  country_name: string | null;
}

export default function AdminDataBuilder() {
  const [countries, setCountries] = useState<
    { id: number; country_name: string; continent: string | null }[]
  >([]);
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [brokenHandles, setBrokenHandles] = useState<Set<string>>(new Set());

  const { cities, states, loading } = useAdminData({
    loadCities: true,
    loadStates: true,
  });

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "/api";

    Promise.all([
      fetchCountries(),
      fetch(`${baseUrl}/listAllArtists`).then(r => {
        if (!r.ok) throw new Error("Failed to fetch artists");
        return r.json();
      }),
      fetch(`${baseUrl}/listBrokenHandles`).then(r => {
        if (!r.ok) throw new Error("Failed to fetch broken handles");
        return r.json();
      }).catch(() => ({ handles: [] })),
    ]).then(([countriesData, artistsData, brokenData]) => {
      setCountries(countriesData);
      setArtists(artistsData.artists || []);
      setBrokenHandles(new Set(brokenData.handles || []));
    }).catch(err => console.error("Error loading data:", err));
  }, []);

  return (
    <div className={styles.page}>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <DataBuilder
          cities={cities}
          states={states}
          countries={countries}
          artists={artists}
          brokenHandles={brokenHandles}
        />
      )}
    </div>
  );
}
