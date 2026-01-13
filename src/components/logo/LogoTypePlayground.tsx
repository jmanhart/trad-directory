import React, { useEffect } from "react";
import TattooBlockSVG from "./TattooBlockSVG";

export default function LogoTypePlayground() {
  useEffect(() => {
    // Inject Google Fonts link for Figtree (not needed for block SVG, but kept for consistency)
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div style={{ margin: "0 auto" }}>
      <TattooBlockSVG />
    </div>
  );
}
