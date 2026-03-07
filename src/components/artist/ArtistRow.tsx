import { Link, useLocation } from "react-router-dom";
import { formatArtistLocation } from "../../utils/formatArtistLocation";
import { getArtistUrl } from "../../services/api";
import InstagramIcon from "../../assets/icons/instagramIcon";
import GlobeIcon from "../../assets/icons/globeIcon";
import { Button } from "../common/FormComponents";
import styles from "./ArtistRow.module.css";

interface ArtistRowProps {
  artist: {
    id: number;
    name: string;
    slug?: string | null;
    instagram_handle?: string;
    city_name?: string;
    state_name?: string;
    country_name?: string;
    is_traveling?: boolean;
  };
}

export default function ArtistRow({ artist }: ArtistRowProps) {
  const location = useLocation();
  const fromSearch = location.pathname === "/search-results";
  const previous = `${location.pathname}${location.search || ""}`;

  const artistInstagramUrl = artist.instagram_handle
    ? `https://www.instagram.com/${artist.instagram_handle}`
    : null;

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
          <h3 className={styles.name}>{artist.name}</h3>
          {locationString && (
            <div className={styles.locationLine}>
              <GlobeIcon className={styles.locationIcon} aria-hidden />
              <span className={styles.locationValue}>{locationString}</span>
            </div>
          )}
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
            className={styles.instagramButton}
          >
            <InstagramIcon className={styles.instagramIcon} aria-hidden />@
            {artist.instagram_handle}
          </Button>
        )}
      </div>
    </Link>
  );
}
