import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchArtistById } from "../../services/api";
import { useSavedArtists } from "../../hooks/useSavedArtists";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./ArtistPage.module.css";

interface Artist {
  id: number;
  name: string;
  instagram_handle?: string | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  shop_id?: number | null;
  shop_name?: string | null;
  shop_instagram_handle?: string | null;
}

export default function ArtistPage() {
  const { artistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedArtists();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const fromSearch = Boolean((location.state as any)?.fromSearch);
  const previous = (location.state as any)?.previous as string | undefined;

  useEffect(() => {
    async function getArtist() {
      try {
        setIsLoading(true);
        setError(null);
        const id = Number(artistId);
        if (!Number.isFinite(id)) {
          throw new Error("Invalid artist id");
        }
        const data = await fetchArtistById(id);
        setArtist(data as unknown as Artist);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    getArtist();
  }, [artistId]);

  const handleBack = () => {
    if (previous) {
      navigate(previous);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!artist) return;

    setSaving(true);
    await toggleSave(artist.id);
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>Loading artist…</div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>Unable to load artist. {error || ""}</div>
      </div>
    );
  }

  const instagramUrl = artist.instagram_handle
    ? `https://www.instagram.com/${artist.instagram_handle}`
    : null;
  const shopInstagramUrl = artist.shop_instagram_handle
    ? `https://www.instagram.com/${artist.shop_instagram_handle}`
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {fromSearch && (
          <button onClick={handleBack} style={{ marginBottom: "1rem" }}>
            ← Back to results
          </button>
        )}
        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{artist.name}</h1>
            {instagramUrl && (
              <div className={styles.handle}>
                <a
                  className={styles.link}
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @{artist.instagram_handle}
                </a>
              </div>
            )}
          </div>
          {false && user && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${styles.saveButton} ${
                isSaved(artist.id) ? styles.saved : ""
              }`}
            >
              {saving
                ? "Saving..."
                : isSaved(artist.id)
                  ? "✓ Saved"
                  : "Save Artist"}
            </button>
          )}
        </div>

        <div className={styles.meta}>
          {artist.city_name && (
            <div className={styles.metaItem}>
              <span className={styles.label}>City</span>
              <span className={styles.value}>{artist.city_name}</span>
            </div>
          )}
          {artist.state_name && (
            <div className={styles.metaItem}>
              <span className={styles.label}>State</span>
              <span className={styles.value}>{artist.state_name}</span>
            </div>
          )}
          {artist.country_name && (
            <div className={styles.metaItem}>
              <span className={styles.label}>Country</span>
              <span className={styles.value}>{artist.country_name}</span>
            </div>
          )}
          {artist.shop_name && (
            <div className={styles.metaItem}>
              <span className={styles.label}>Shop</span>
              <span className={styles.value}>{artist.shop_name}</span>
            </div>
          )}
          {shopInstagramUrl && (
            <div className={styles.metaItem}>
              <span className={styles.label}>Shop Instagram</span>
              <a
                className={styles.link}
                href={shopInstagramUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                @{artist.shop_instagram_handle}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
