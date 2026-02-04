import React, { useState, useEffect, useMemo } from "react";
import {
  fetchAllCountries,
  fetchTattooShopsWithArtists,
  fetchAllShops,
} from "../../services/api";
import CountryCard, { type CountryCardData } from "../country/CountryCard";
import LocationResultsHeader from "../results/LocationResultsHeader";
import styles from "./AllCountriesPage.module.css";

function normalizeCountryName(name: string | undefined | null): string {
  if (!name || name === "N/A") return "";
  return name.trim();
}

export default function AllCountriesPage() {
  const [countries, setCountries] = useState<
    { id: number; country_name: string }[]
  >([]);
  const [artists, setArtists] = useState<
    { id: number; country_name?: string }[]
  >([]);
  const [shops, setShops] = useState<
    { id: number; country_name?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [countriesData, artistsData, shopsData] = await Promise.all([
          fetchAllCountries(),
          fetchTattooShopsWithArtists(),
          fetchAllShops(),
        ]);
        setCountries(countriesData);
        setArtists(artistsData);
        setShops(shopsData);
      } catch (err) {
        console.error("Error loading countries data:", err);
        setError("Failed to load countries");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const countriesWithCounts: CountryCardData[] = useMemo(() => {
    const artistCountByCountry: Record<string, number> = {};
    const shopCountByCountry: Record<string, number> = {};

    artists.forEach((a) => {
      const key = normalizeCountryName(a.country_name);
      if (key) artistCountByCountry[key] = (artistCountByCountry[key] ?? 0) + 1;
    });

    shops.forEach((s) => {
      const key = normalizeCountryName(s.country_name);
      if (key) shopCountByCountry[key] = (shopCountByCountry[key] ?? 0) + 1;
    });

    return countries.map((c) => {
      const name = c.country_name;
      const artistCount = artistCountByCountry[name] ?? 0;
      const shopCount = shopCountByCountry[name] ?? 0;
      return {
        id: c.id,
        country_name: name,
        artistCount,
        shopCount,
      };
    });
  }, [countries, artists, shops]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading countries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchInfo}>
        <LocationResultsHeader
          title="All Countries"
          resultsCount={countriesWithCounts.length}
        />
      </div>

      <div className={styles.grid}>
        {countriesWithCounts.map((country) => (
          <CountryCard key={country.id} country={country} />
        ))}
      </div>

      {countriesWithCounts.length === 0 && (
        <div className={styles.noResults}>
          <p>No countries found.</p>
        </div>
      )}
    </div>
  );
}
