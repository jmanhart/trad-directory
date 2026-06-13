import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { trackHeroMessageClick } from "../../../utils/analytics";
import styles from "./HeroMessageText.module.css";

export default function HeroMessageText() {
  const [artistCount, setArtistCount] = useState<number | null>(null);
  const [shopCount, setShopCount] = useState<number | null>(null);
  const [countryCount, setCountryCount] = useState<number | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        const { count: artistCount, error: artistError } = await supabase
          .from("artists")
          .select("*", { count: "exact", head: true });
        if (artistError) throw artistError;

        const { count: shopCount, error: shopError } = await supabase
          .from("tattoo_shops")
          .select("*", { count: "exact", head: true });
        if (shopError) throw shopError;

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
      <span className={styles.metricNumberText}>
          {artistCount !== null ? artistCount.toLocaleString() : "--"}
        </span>{" "}
      artists working at over{" "}
      <span className={styles.metricNumberText}>
          {shopCount !== null ? shopCount.toLocaleString() : "--"}
        </span>{" "}
      tattoo shops in{" "}
      <Link
        to="/map"
        className={styles.metricLink}
        onClick={() =>
          trackHeroMessageClick({
            link_type: "countries",
            metric_value: countryCount ?? undefined,
          })
        }
      >
        <span className={styles.metricNumberText}>
          {countryCount !== null ? countryCount : "--"}
        </span>
      </Link>{" "}
      countries worldwide.
    </h1>
  );
}
