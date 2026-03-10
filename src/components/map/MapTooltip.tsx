import styles from "./MapView.module.css";

interface MapTooltipProps {
  cityName: string;
  stateName?: string | null;
  countryName?: string | null;
  artistCount: number;
  x: number;
  y: number;
}

export default function MapTooltip({
  cityName,
  stateName,
  countryName,
  artistCount,
  x,
  y,
}: MapTooltipProps) {
  const locationParts = [cityName, stateName, countryName].filter(Boolean);

  return (
    <div
      className={styles.tooltip}
      style={{
        left: `${x + 12}px`,
        top: `${y + 12}px`,
      }}
    >
      <div className={styles.tooltipCity}>{locationParts.join(", ")}</div>
      <div className={styles.tooltipCount}>
        {artistCount} {artistCount === 1 ? "artist" : "artists"}
      </div>
    </div>
  );
}
