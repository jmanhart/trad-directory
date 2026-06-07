import { useState, useEffect } from "react";
import { useAdminData } from "./useAdminData";
import { fetchCountries } from "../../../services/adminApi";
import DataBuilder from "./DataBuilder";
import styles from "./AdminDataBuilder.module.css";

export default function AdminDataBuilder() {
  const [countries, setCountries] = useState<
    { id: number; country_name: string; continent: string | null }[]
  >([]);

  const { cities, states, loading } = useAdminData({
    loadCities: true,
    loadStates: true,
  });

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(err => console.error("Error loading countries:", err));
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
        />
      )}
    </div>
  );
}
