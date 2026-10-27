import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { fetchArtistById, fetchShopById } from "../../services/api";
import { useSavedArtists } from "../../hooks/useSavedArtists";
import { useSavedShops } from "../../hooks/useSavedShops";
import ArtistCard from "../artist/ArtistCard";
import ShopCard from "../shop/ShopCard";
import type { Shop } from "../../types";
import styles from "./SavedPage.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string;
  shop_name?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

export default function SavedPage() {
  const { user } = useAuth();
  const { toggleSave: toggleSaveArtist } = useSavedArtists();
  const { toggleSave: toggleSaveShop } = useSavedShops();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSaved();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSaved = async () => {
    setLoading(true);
    await Promise.all([fetchSavedArtists(), fetchSavedShops()]);
    setLoading(false);
  };

  const fetchSavedArtists = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_artists")
      .select("artist_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved artists:", error);
      return;
    }

    const results = await Promise.all(
      (data || []).map(s => fetchArtistById(s.artist_id).catch(() => null))
    );
    setArtists(results.filter((a): a is Artist => a !== null));
  };

  const fetchSavedShops = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_shops")
      .select("shop_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved shops:", error);
      return;
    }

    const results = await Promise.all(
      (data || []).map(s => fetchShopById(s.shop_id).catch(() => null))
    );
    setShops(results.filter((s): s is Shop => s !== null));
  };

  const handleRemoveArtist = async (artistId: number) => {
    await toggleSaveArtist(artistId);
    setArtists(prev => prev.filter(a => a.id !== artistId));
  };

  const handleRemoveShop = async (shopId: number) => {
    await toggleSaveShop(shopId);
    setShops(prev => prev.filter(s => s.id !== shopId));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading saved…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Saved</h1>

      <section className={styles.section}>
        <h2>Artists</h2>
        {artists.length === 0 ? (
          <p className={styles.empty}>No saved artists yet.</p>
        ) : (
          <div className={styles.grid}>
            {artists.map(artist => (
              <div key={artist.id} className={styles.cardWrapper}>
                <ArtistCard artist={artist} />
                <button
                  onClick={() => handleRemoveArtist(artist.id)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Shops</h2>
        {shops.length === 0 ? (
          <p className={styles.empty}>No saved shops yet.</p>
        ) : (
          <div className={styles.grid}>
            {shops.map(shop => (
              <div key={shop.id} className={styles.cardWrapper}>
                <ShopCard shop={shop} />
                <button
                  onClick={() => handleRemoveShop(shop.id)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
