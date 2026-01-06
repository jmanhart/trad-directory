import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { fetchArtistById } from "../../services/api";
import { useSavedArtists } from "../../hooks/useSavedArtists";
import ArtistCard from "../artist/ArtistCard";
import styles from "./SavedPage.module.css";

interface SavedArtist {
  id: number;
  artist_id: number;
  created_at: string;
}

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
  const { toggleSave } = useSavedArtists();
  const [savedArtists, setSavedArtists] = useState<SavedArtist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedArtists();
    }
  }, [user]);

  const fetchSavedArtists = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("saved_artists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved artists:", error);
      setLoading(false);
      return;
    }

    setSavedArtists(data || []);

    // Fetch full artist details
    if (data && data.length > 0) {
      const artistPromises = data.map((saved) => 
        fetchArtistById(saved.artist_id).catch(() => null)
      );
      const artistResults = await Promise.all(artistPromises);
      const fetchedArtists = artistResults.filter((artist): artist is Artist => 
        artist !== null
      );
      setArtists(fetchedArtists);
    }

    setLoading(false);
  };

  const handleRemove = async (artistId: number) => {
    await toggleSave(artistId);
    // Refresh the list
    fetchSavedArtists();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading saved artists...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Saved Artists</h1>
      {artists.length === 0 ? (
        <p className={styles.empty}>No saved artists yet.</p>
      ) : (
        <div className={styles.grid}>
          {artists.map((artist) => (
            <div key={artist.id} className={styles.cardWrapper}>
              <ArtistCard artist={artist} />
              <button
                onClick={() => handleRemove(artist.id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

