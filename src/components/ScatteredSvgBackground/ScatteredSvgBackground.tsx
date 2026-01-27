import { useMemo, useState, useEffect } from "react";
import { presets, type BgPreset } from "./backgroundPresets";
import styles from "./ScatteredSvgBackground.module.css";

export interface ScatteredSvgBackgroundProps {
  preset?: "default" | "alt1" | "alt2";
  className?: string;
  intensity?: "subtle" | "medium";
}

export default function ScatteredSvgBackground({
  preset = "default",
  className = "",
  intensity = "subtle",
}: ScatteredSvgBackgroundProps) {
  const config: BgPreset = useMemo(() => {
    return presets[preset] || presets.default;
  }, [preset]);

  // Track viewport width for responsive hiding
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter items based on viewport width
  const visibleItems = useMemo(() => {
    return config.items.filter(
      (item) => !item.hideBelowPx || viewportWidth >= item.hideBelowPx
    );
  }, [config.items, viewportWidth]);

  const intensityClass = intensity === "subtle" ? styles.intensitySubtle : styles.intensityMedium;

  // Debug: log visible items
  if (visibleItems.length === 0) {
    console.warn("ScatteredSvgBackground: No visible items", { viewportWidth, totalItems: config.items.length });
  }

  // Debug logging
  useEffect(() => {
    console.log("ScatteredSvgBackground mounted/updated", { 
      visibleItems: visibleItems.length, 
      totalItems: config.items.length,
      preset,
      overallOpacity: config.overallOpacity,
      viewportWidth
    });
  }, [visibleItems.length, config.items.length, preset, config.overallOpacity, viewportWidth]);

  return (
    <div className={`${styles.overlay} ${intensityClass} ${className}`}>
      {/* Debug: Show count of items */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '10px', 
          background: 'red', 
          color: 'white', 
          padding: '5px',
          zIndex: 9999,
          fontSize: '12px'
        }}>
          Items: {visibleItems.length}
        </div>
      )}
      {visibleItems.map((item, index) => {
        const finalOpacity = (item.opacity ?? 1) * config.overallOpacity;
        const filter = item.blurPx ? `blur(${item.blurPx}px)` : "none";

        return (
          <div
            key={`${item.src}-${index}`}
            className={styles.item}
            style={{
              left: item.x,
              top: item.y,
              width: `${item.size}px`,
              height: `${item.size}px`,
              transform: `translate3d(0, 0, 0) rotate(${item.rotate}deg)`,
              opacity: finalOpacity,
              filter,
            }}
          >
            <img
              src={item.src}
              alt={item.alt || ""}
              loading="lazy"
              draggable={false}
              onError={(e) => {
                console.error(`Failed to load image: ${item.src}`, e);
              }}
              onLoad={() => {
                console.log(`Successfully loaded: ${item.src}`);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
