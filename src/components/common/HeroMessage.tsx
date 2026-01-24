import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./../../services/supabaseClient";
import { trackHeroMessageClick } from "../../utils/analytics";
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

  return (
    <h1 className={styles.heroMessage}>
      Discover{" "}
      <Link 
        to="/artists" 
        className={styles.metricLink}
        onClick={() => trackHeroMessageClick({ 
          link_type: 'artists',
          metric_value: artistCount || undefined 
        })}
      >
        <strong className={styles.metricNumber}>{artistCount !== null ? artistCount : "--"}</strong>
      </Link>{" "}
      artists working at over{" "}
      <Link 
        to="/shops" 
        className={styles.metricLink}
        onClick={() => trackHeroMessageClick({ 
          link_type: 'shops',
          metric_value: shopCount || undefined 
        })}
      >
        <strong className={styles.metricNumber}>{shopCount !== null ? shopCount : "--"}</strong>
      </Link>{" "}
      tattoo shops in{" "}
      <strong className={styles.metricNumberNoUnderline}>{countryCount !== null ? countryCount : "--"}</strong> countries worldwide.
    </h1>
  );
}
