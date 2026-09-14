import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

// Mirrors useSavedArtists for shop favorites (the saved_shops table). Same
// per-user, RLS-own-rows pattern; reads/writes go straight to Supabase from
// the browser, not through /api.
export function useSavedShops() {
  const { user } = useAuth();
  const [savedShopIds, setSavedShopIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedIds();
    } else {
      setSavedShopIds(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchSavedIds = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("saved_shops")
      .select("shop_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching saved shops:", error);
    } else {
      setSavedShopIds(new Set((data || []).map(s => s.shop_id)));
    }
    setLoading(false);
  };

  const toggleSave = async (shopId: number): Promise<boolean> => {
    if (!user) return false;

    const isSaved = savedShopIds.has(shopId);

    if (isSaved) {
      // Remove from saved
      const { error } = await supabase
        .from("saved_shops")
        .delete()
        .eq("user_id", user.id)
        .eq("shop_id", shopId);

      if (!error) {
        setSavedShopIds(prev => {
          const next = new Set(prev);
          next.delete(shopId);
          return next;
        });
        return true;
      }
      console.error("Error removing saved shop:", error);
    } else {
      const { error } = await supabase.from("saved_shops").insert({
        user_id: user.id,
        shop_id: shopId,
      });

      if (!error) {
        setSavedShopIds(prev => new Set(prev).add(shopId));
        return true;
      }
      console.error("Error saving shop:", error);
    }
    return false;
  };

  return {
    savedShopIds,
    isSaved: (shopId: number) => savedShopIds.has(shopId),
    toggleSave,
    loading,
  };
}
