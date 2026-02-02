import React from "react";
import styles from "./ArtistPageV2.module.css";
import ArtistInfo from "./ArtistInfo";
import ArtistPortfolio from "./ArtistPortfolio";
import type { ArtistPageV2Artist } from "./types";

/** Set to false to hide the portfolio section while you design the rest. */
const SHOW_ARTIST_PORTFOLIO = true;

export type { ArtistPageV2Artist } from "./types";

export interface ArtistPageV2Props {
  artist: ArtistPageV2Artist | null;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  showBackButton?: boolean;
}

/**
 * New artist page view. Toggle by setting USE_NEW_ARTIST_PAGE = true in ArtistPage.tsx.
 */
export default function ArtistPageV2({
  artist,
  error,
  isLoading,
  onBack,
  showBackButton = false,
}: ArtistPageV2Props) {
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {showBackButton && (
          <button type="button" onClick={onBack} className={styles.backButton}>
            ← Back to results
          </button>
        )}
        <ArtistInfo artist={artist} imageUrl={null} />
        {SHOW_ARTIST_PORTFOLIO && <ArtistPortfolio />}
      </div>
    </div>
  );
}
