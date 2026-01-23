import { formatArtistLocation } from "../../utils/formatArtistLocation";
import styles from "./ShopCard.module.css";

interface ShopCardProps {
  shop: {
    id: number;
    name: string;
    city_name?: string;
    state_name?: string;
    country_name?: string;
  };
}

export default function ShopCard({ shop }: ShopCardProps) {
  const locationString = formatArtistLocation({
    city_name: shop.city_name,
    state_name: shop.state_name,
    country_name: shop.country_name,
    is_traveling: false,
  });

  return (
    <div className={styles.card}>
      <h2>{shop.name}</h2>
      {locationString && <p>{locationString}</p>}
    </div>
  );
}
