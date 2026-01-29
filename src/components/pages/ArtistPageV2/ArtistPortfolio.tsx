import React from "react";
import styles from "./ArtistPortfolio.module.css";

export interface ArtistPortfolioProps {
  /** Optional title override. */
  title?: string;
  /** Optional content; when not provided, a placeholder is shown. */
  children?: React.ReactNode;
}

export default function ArtistPortfolio({
  title = "Portfolio",
  children,
}: ArtistPortfolioProps) {
  return (
    <section className={styles.section} aria-label="Artist portfolio">
      {children ?? (
        <div className={styles.placeholder}>Portfolio content coming soon</div>
      )}
    </section>
  );
}
