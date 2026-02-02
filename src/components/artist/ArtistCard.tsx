import styles from "./ArtistCard.module.css";
import { Link, useLocation } from "react-router-dom";
import { formatRelativeTime } from "../../utils/relativeTime";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { getArtistUrl } from "../../services/api";
import InstagramIcon from "../../assets/icons/instagramIcon";
import GlobeIcon from "../../assets/icons/globeIcon";
import { Button } from "../common/FormComponents";

interface Artist {
  id: number;
  name: string;
  slug?: string | null;
  instagram_handle?: string;
  shop_name?: string;
  shop_instagram_handle?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  created_at?: string | null;
  is_traveling?: boolean;
}

interface ArtistCardProps {
  artist: Artist;
  showTimestamp?: boolean;
}

export default function ArtistCard({
  artist,
  showTimestamp = false,
}: ArtistCardProps) {
  const location = useLocation();
  const artistInstagramUrl = artist.instagram_handle
    ? `https://www.instagram.com/${artist.instagram_handle}`
    : null;

  const fromSearch = location.pathname === "/search-results";
  const previous = `${location.pathname}${location.search || ""}`;

  const locationString = formatArtistLocation({
    city_name: artist.city_name,
    state_name: artist.state_name,
    country_name: artist.country_name,
    is_traveling: artist.is_traveling,
  });

  return (
    <Link
      to={getArtistUrl(artist)}
      state={{ fromSearch, previous }}
      className={styles.cardLink}
    >
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.nameRow}>
              <h3 className={styles.artistName}>{artist.name}</h3>
              {showTimestamp && artist.created_at && (
                <span className={styles.timestampLabel}>
                  {formatRelativeTime(artist.created_at)}
                </span>
              )}
            </div>
            {artist.instagram_handle && (
              <span className={styles.instagramHandle}>
                @{artist.instagram_handle}
              </span>
            )}
            {(locationString || artist.is_traveling) && (
              <div className={styles.locationLine}>
                <GlobeIcon className={styles.locationIcon} aria-hidden />
                <span className={styles.locationValue}>{locationString}</span>
              </div>
            )}
          </div>
        </div>
        {artistInstagramUrl && (
          <Button
            variant="secondary"
            size="small"
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              window.open(artistInstagramUrl, "_blank", "noopener,noreferrer");
            }}
          >
            View Artist
          </Button>
        )}
      </div>
    </Link>
  );
}
