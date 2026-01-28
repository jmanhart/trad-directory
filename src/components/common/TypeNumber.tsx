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

  return (
    <span className={`${styles.root} ${className}`}>
      {digits.split("").map((digit, index) => {
        const src =
          variant === "red" ? `/TYPE/${digit}-red.svg` : `/TYPE/${digit}.svg`;

        return (
          <span key={`${digit}-${index}`} className={styles.digitWrapper}>
            <img
              src={src}
              alt={digit}
              className={`${styles.digitImage} ${digitClassName}`}
              onError={(e) => {
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

