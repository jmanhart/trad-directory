import React from "react";
import ShopCard from "./ShopCard";
import styles from "./ShopList.module.css";

interface Shop {
  id: number;
  name: string;
  address?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface ShopListProps {
  shops: Shop[] | undefined; // Allow for undefined to prevent errors
}

const ShopList: React.FC<ShopListProps> = ({ shops = [] }) => {
  return (
    <div className={styles.list}>
      {shops.length > 0 ? (
        shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
      ) : (
        <p>No shops found.</p>
      )}
    </div>
  );
};

export default ShopList;
