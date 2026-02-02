import React from "react";
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
    <div className={styles.line} aria-label="Location results">
      <GlobeIcon className={styles.icon} aria-hidden />
      <h2 className={styles.title}>{title}</h2>
      {resultsCount !== undefined && resultsCount >= 0 && (
        <span className={styles.resultsLine}>
          {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
        </span>
      )}
    </div>
  );
}
