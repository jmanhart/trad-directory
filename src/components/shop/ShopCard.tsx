import React from "react";
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
  return (
    <div className={styles.card}>
      <h2>{shop.name}</h2>
      <p>
        {shop.city_name}, {shop.state_name}, {shop.country_name}
      </p>
    </div>
  );
}
