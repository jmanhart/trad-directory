import React from "react";
import styles from "./ArtistPortfolio.module.css";

const FPO_IMAGES = [
  "/FPO-IMAGES/01-FPO-TATTOO.png",
  "/FPO-IMAGES/02-FPO-TATTOO.png",
  "/FPO-IMAGES/03-FPO-TATTOO.png",
  "/FPO-IMAGES/04-FPO-TATTOO.png",
  "/FPO-IMAGES/05-FPO-TATTOO.png",
  "/FPO-IMAGES/06-FPO-TATTOO.png",
  "/FPO-IMAGES/07-FPO-TATTOO.png",
  "/FPO-IMAGES/08-FPO-TATTOO.png",
  "/FPO-IMAGES/09-FPO-TATTOO.png",
  "/FPO-IMAGES/10-FPO-TATTOO.png",
  "/FPO-IMAGES/11-FPO-TATTOO.png",
  "/FPO-IMAGES/12-FPO-TATTOO.png",
  "/FPO-IMAGES/13-FPO-TATTOO.png",
  "/FPO-IMAGES/14-FPO-TATTOO.png",
  "/FPO-IMAGES/15-FPO-TATTOO.png",
  "/FPO-IMAGES/16-FPO-TATTOO.png",
  "/FPO-IMAGES/17-FPO-TATTOO.png",
  "/FPO-IMAGES/18-FPO-TATTOO.png",
  "/FPO-IMAGES/19-FPO-TATTOO.png",
  "/FPO-IMAGES/20-FPO-TATTOO.png",
];

export interface ArtistPortfolioProps {
  /** Optional title override. */
  title?: string;
  /** Optional content; when not provided, FPO grid is shown. */
  children?: React.ReactNode;
}

export default function ArtistPortfolio({ children }: ArtistPortfolioProps) {
  if (children) {
    return (
      <section className={styles.section} aria-label="Artist portfolio">
        {children}
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="Artist portfolio">
      <div className={styles.gallery} role="list">
        {FPO_IMAGES.map(src => (
          <div key={src} className={styles.galleryItem} role="listitem">
            <img
              src={src}
              alt=""
              className={styles.galleryImage}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
