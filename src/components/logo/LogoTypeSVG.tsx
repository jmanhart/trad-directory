import React, { useEffect } from "react";

interface LogoTypeSVGProps {
  text?: string;
  fontSize?: number;
}

export default function LogoTypeSVG({
  text = "Tattoo Directory",
  fontSize = 160,
}: LogoTypeSVGProps) {
  useEffect(() => {
    // Inject Google Fonts link for Figtree
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <svg
      width="100%"
      height={fontSize * 1.5}
      viewBox={`0 0 1200 ${fontSize * 1.5}`}
      style={{ display: "block", maxWidth: "100%" }}
    >
      <defs>
        <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffeb3b" />
          <stop offset="100%" stopColor="#ff9800" />
        </linearGradient>
        <filter id="extrude" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset result="offOut" in="SourceAlpha" dx="16" dy="16" />
          <feFlood floodColor="#ffb300" />
          <feComposite in2="offOut" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="60"
        y={fontSize}
        fontFamily="'Figtree', sans-serif"
        fontWeight="900"
        fontSize={fontSize}
        fill="url(#face)"
        stroke="#222"
        strokeWidth="6"
        filter="url(#extrude)"
        style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
      >
        {text}
      </text>
    </svg>
  );
}
