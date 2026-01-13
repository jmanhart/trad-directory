import React, { useEffect, useState } from "react";
import { supabase } from "./../../services/supabaseClient";
import styles from "./HeroMessage.module.css";

export default function HeroMessage() {
  const [artistCount, setArtistCount] = useState<number | null>(null);
  const [shopCount, setShopCount] = useState<number | null>(null);
  const [countryCount, setCountryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        // Fetch total artist count
        const { count: artistCount, error: artistError } = await supabase
          .from("artists")
          .select("*", { count: "exact", head: true });
        if (artistError) throw artistError;

        // Fetch total shop count
        const { count: shopCount, error: shopError } = await supabase
          .from("tattoo_shops")
          .select("*", { count: "exact", head: true });
        if (shopError) throw shopError;

        // Fetch unique country count
        const { data: countries, error: countryError } = await supabase
          .from("countries")
          .select("id", { count: "exact" });
        if (countryError) throw countryError;

        setArtistCount(artistCount || 0);
        setShopCount(shopCount || 0);
        setCountryCount(countries?.length || 0);
      } catch (error) {
        console.error("Error fetching hero message counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (loading) {
    return <p className={styles.heroMessage}>Loading stats...</p>;
  }

  return (
    <h1 className={styles.heroMessage}>
      Discover <strong>{artistCount || 0}</strong> artists working at over{" "}
      <strong>{shopCount || 0}</strong> tattoo shops in{" "}
      <strong>{countryCount || 0}</strong> countries worldwide. List grows
      daily.
    </h1>
  );
}
