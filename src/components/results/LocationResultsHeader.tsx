import GlobeIcon from "../../assets/icons/globeIcon";
import styles from "./LocationResultsHeader.module.css";

export interface LocationResultsHeaderProps {
  /** Main title (e.g. location name or search query) – shown large like ArtistInfo name. */
  title: string;
  /** Optional results count; when set, shows "X result(s) found" below. */
  resultsCount?: number;
}

export default function LocationResultsHeader({
  title,
  resultsCount,
}: LocationResultsHeaderProps) {
  return (
    <div className={styles.wrapper} aria-label="Location results">
      <div className={styles.titleBlock}>
        <GlobeIcon className={styles.icon} aria-hidden />
        <h2 className={styles.title}>{title}</h2>
      </div>
      {resultsCount !== undefined && resultsCount >= 0 && (
        <p className={styles.resultsLine}>
          {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}
