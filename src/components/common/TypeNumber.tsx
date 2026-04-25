import React from "react";
import styles from "./TypeNumber.module.css";

interface TypeNumberProps {
  value: number | string | null | undefined;
  /** Which TYPE asset variant to use */
  variant?: "red" | "default";
  /** Wrapper classes so it can inherit existing typography styles */
  className?: string;
  /** Extra classes for each digit image */
  digitClassName?: string;
  /** What to show when value is not available yet */
  placeholder?: React.ReactNode;
}

export default function TypeNumber({
  value,
  variant = "red",
  className = "",
  digitClassName = "",
  placeholder = "--",
}: TypeNumberProps) {
  // Treat null/undefined/empty as "no data yet"
  if (value === null || value === undefined || value === "") {
    return <span className={className}>{placeholder}</span>;
  }

  // Only keep digits – counts on the homepage are positive integers
  const digits = String(value).replace(/[^0-9]/g, "");

  if (!digits) {
    return <span className={className}>{placeholder}</span>;
  }

  // Format with commas (e.g. "1003" → "1,003")
  const formatted = Number(digits).toLocaleString("en-US");

  return (
    <span className={`${styles.root} ${className}`}>
      {formatted.split("").map((char, index) => {
        if (char === ",") {
          return (
            <span key={`comma-${index}`} className={styles.comma}>
              ,
            </span>
          );
        }

        const src =
          variant === "red" ? `/TYPE/${char}-red.svg` : `/TYPE/${char}.svg`;

        return (
          <span key={`${char}-${index}`} className={styles.digitWrapper}>
            <img
              src={src}
              alt={char}
              className={`${styles.digitImage} ${digitClassName}`}
              onError={e => {
                // Fail silently if an asset is missing
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </span>
        );
      })}
    </span>
  );
}

