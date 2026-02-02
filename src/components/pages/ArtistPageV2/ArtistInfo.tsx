import GlobeIcon from "../../../assets/icons/globeIcon";
import InstagramIcon from "../../../assets/icons/instagramIcon";
import { Button } from "../../common/FormComponents";
import { formatArtistLocation } from "../../../utils/formatArtistLocation";
import type { ArtistPageV2Artist } from "./types";
import styles from "./ArtistInfo.module.css";

export interface ArtistInfoProps {
  artist: ArtistPageV2Artist;
  /** Optional image URL; if not set, a placeholder is shown. */
  imageUrl?: string | null;
}

export default function ArtistInfo({ artist, imageUrl }: ArtistInfoProps) {
  const instagramUrl = artist.instagram_handle
    ? `https://www.instagram.com/${artist.instagram_handle}`
    : null;
  const shopInstagramUrl = artist.shop_instagram_handle
    ? `https://www.instagram.com/${artist.shop_instagram_handle}`
    : null;
  const locationString = formatArtistLocation(artist);

  return (
    <section className={styles.section} aria-label="Artist information">
      {/* <div className={styles.imageWrapper}>
        {imageUrl ? (
          <img src={imageUrl} alt="" className={styles.image} />
        ) : (
          <span>FPO</span>
        )}
      </div> */}

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.name}>{artist.name}</h1>
          {instagramUrl && (
            <a
              className={styles.instagramLink}
              href={instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              @{artist.instagram_handle}
            </a>
          )}
          {locationString && (
            <div className={styles.locationLine}>
              <GlobeIcon className={styles.locationIcon} aria-hidden />
              <span className={styles.value}>{locationString}</span>
            </div>
          )}
        </div>
      </div>
      {instagramUrl && (
        <Button
          variant="primary"
          type="button"
          icon={<InstagramIcon />}
          onClick={() =>
            window.open(instagramUrl, "_blank", "noopener,noreferrer")
          }
        >
          @{artist.instagram_handle}
        </Button>
      )}
    </section>
  );
}
