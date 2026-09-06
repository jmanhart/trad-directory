import styles from "./PanelHeroBackground.module.css";

// Decorative hero backdrop shared by the map panels: the app's light-red tint
// plus a few faint flash illustrations bleeding off the top/left/right edges.
// Purely decorative — aria-hidden, no pointer events. Rendered as an absolute
// fill behind the panel's header region (which sits above via z-index).
const ART = [
  { src: "/FLASH/WOLF.svg", className: styles.artTopLeft },
  { src: "/FLASH/SPARROW.svg", className: styles.artTopMid },
  { src: "/FLASH/ROSE_SINGLE.svg", className: styles.artTopRight },
  { src: "/FLASH/EAGLE.svg", className: styles.artRight },
];

export function PanelHeroBackground() {
  return (
    <div className={styles.hero} aria-hidden="true">
      {ART.map(a => (
        <img
          key={a.src}
          src={a.src}
          alt=""
          draggable={false}
          className={`${styles.art} ${a.className}`}
        />
      ))}
    </div>
  );
}
