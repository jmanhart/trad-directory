import React from "react";
import styles from "./ShopCard.module.css";

interface Shop {
  id: number;
  name: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface ShopCardProps {
  shop: Shop;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <div className={styles.card}>
      <h2>{shop.name}</h2>
      <p>Address: {shop.address || "N/A"}</p>
      <p>City: {shop.city_name || "N/A"}</p>
      <p>State: {shop.state_name || "N/A"}</p>
      <p>Country: {shop.country_name || "N/A"}</p>
      <a href={`/shop/${shop.id}`} className={styles.link}>
        View Shop Details
      </a>
    </div>
  );
};

export default ShopCard;
