import React from "react";
import ShopCard from "./ShopCard";
import styles from "./ShopList.module.css";
import { supabase } from "../../services/supabaseClient";

interface Shop {
  id: number;
  name: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

const ShopList: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tattoo_shops") // Replace with your table name
        .select("id, name, city_name, state_name, country_name");

      if (error) {
        console.error("Error fetching shops:", error);
      } else {
        setShops(data || []);
      }

      setLoading(false);
    };

    fetchShops();
  }, []);

  if (loading) {
    return <p>Loading shops...</p>;
  }

  if (!shops.length) {
    return <p>No shops to display.</p>;
  }

  return (
    <div className={styles.list}>
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  );
};

export default ShopList;
