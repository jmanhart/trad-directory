import { Link } from "react-router-dom";
import styles from "./CountryCard.module.css";

export interface CountryCardData {
  id: number;
  country_name: string;
  artistCount: number;
  shopCount: number;
}

interface CountryCardProps {
  country: CountryCardData;
}

export default function CountryCard({ country }: CountryCardProps) {
  const searchUrl = `/search-results?q=${encodeURIComponent(country.country_name)}`;

  const artistLabel = country.artistCount === 1 ? "artist" : "artists";
  const shopLabel = country.shopCount === 1 ? "shop" : "shops";
  const statsText = `${country.artistCount} ${artistLabel} · ${country.shopCount} ${shopLabel}`;

  return (
    <Link to={searchUrl} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.countryName}>{country.country_name}</h3>
            <span className={styles.statsLine}>{statsText}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
