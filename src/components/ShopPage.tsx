import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchShopById } from "../services/api"; // Create this API call
import ArtistCard from "./ArtistCard";
// import styles from "./ShopPage.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
}

interface Shop {
  id: number;
  name: string;
  address: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  artists: Artist[];
}

const ShopPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getShop() {
      try {
        const data = await fetchShopById(Number(id));
        setShop(data);
      } catch (error: any) {
        setError("Error fetching shop details.");
        console.error(error);
      }
    }

    if (id) getShop();
  }, [id]);

  if (!shop) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <h1>{shop.name}</h1>
      <p>Address: {shop.address}</p>
      {/* The rest of the shop details */}
      <h2>Artists at this Shop</h2>
      {shop.artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
};

export default ShopPage;
