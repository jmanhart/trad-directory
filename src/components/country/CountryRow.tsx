import { Link } from "react-router-dom";
import type { CountryCardData } from "./CountryCard";
import styles from "./CountryRow.module.css";

interface CountryRowProps {
  country: CountryCardData;
}

export default function CountryRow({ country }: CountryRowProps) {
  const searchUrl = `/search-results?q=${encodeURIComponent(country.country_name)}`;
  const artistLabel = country.artistCount === 1 ? "artist" : "artists";
  const shopLabel = country.shopCount === 1 ? "shop" : "shops";
  const statsText = `${country.artistCount} ${artistLabel} · ${country.shopCount} ${shopLabel}`;

  return (
    <Link to={searchUrl} className={styles.cardLink}>
      <div className={styles.card}>
        <h3 className={styles.name}>{country.country_name}</h3>
        <span className={styles.statsLine}>{statsText}</span>
      </div>
    </Link>
  );
}
