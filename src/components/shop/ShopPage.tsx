import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./../../services/supabaseClient";

interface Shop {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  artists?: string[];
}

const ShopPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>(); // Dynamic route parameter
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);

      // Replace "tattoo_shops" with your actual Supabase table name
      const { data, error } = await supabase
        .from("tattoo_shops")
        .select("id, shop_name, address") // Include all required columns
        .eq("id", shopId)
        .single(); // Fetch a single record

      if (error) {
        setError("Failed to load shop data.");
        console.error(error);
      } else {
        setShop(data);
      }

      setLoading(false);
    };

    fetchShop();
  }, [shopId]);

  if (loading) {
    return <p>Loading shop details...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!shop) {
    return <p>Shop not found.</p>;
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>{shop.shop_name}</h1>
      <p>
        <strong>Address:</strong> {shop.address || "No address available"}
      </p>
      {/* <h2>Artists:</h2>
      {shop.artists && shop.artists.length > 0 ? (
        <ul>
          {shop.artists.map((artist, index) => (
            <li key={index}>{artist}</li>
          ))}
        </ul>
      ) : (
        <p>No artists listed for this shop.</p>
      )} */}
    </div>
  );
};

export default ShopPage;
