import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

export function useSavedArtists() {
  const { user } = useAuth();
  const [savedArtistIds, setSavedArtistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedIds();
    } else {
      setSavedArtistIds(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchSavedIds = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("saved_artists")
      .select("artist_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching saved artists:", error);
    } else {
      setSavedArtistIds(new Set((data || []).map((s) => s.artist_id)));
    }
    setLoading(false);
  };

  const toggleSave = async (artistId: number): Promise<boolean> => {
    if (!user) return false;

    const isSaved = savedArtistIds.has(artistId);

    if (isSaved) {
      // Remove from saved
      const { error } = await supabase
        .from("saved_artists")
        .delete()
        .eq("user_id", user.id)
        .eq("artist_id", artistId);

      if (!error) {
        setSavedArtistIds((prev) => {
          const next = new Set(prev);
          next.delete(artistId);
          return next;
        });
        return true;
      }
    } else {
      // Add to saved
      const { error } = await supabase.from("saved_artists").insert({
        user_id: user.id,
        artist_id: artistId,
      });

      if (!error) {
        setSavedArtistIds((prev) => new Set(prev).add(artistId));
        return true;
      }
    }
    return false;
  };

  return {
    savedArtistIds,
    isSaved: (artistId: number) => savedArtistIds.has(artistId),
    toggleSave,
    loading,
  };
}

