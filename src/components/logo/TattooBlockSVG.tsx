import React from "react";

export default function TattooBlockSVG() {
  return (
  <svg
    width="100%"
    height="320"
    viewBox="0 0 500 320"
    style={{ display: "block", maxWidth: "100%" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Extrusion for T */}
    <path
      d="M30 60 L170 60 L170 80 L110 80 L110 220 L90 220 L90 80 L30 80 Z
         M110 220 L130 240 L130 100 L110 80 Z
         M90 220 L110 220 L130 240 L110 240 Z"
      fill="#ffb300"
      stroke="none"
    />
    {/* Extrusion for A */}
    <path
      d="M180 220 L200 80 L240 80 L260 220 L240 200 L200 200 Z
         M240 200 L260 220 L260 240 L240 220 Z
         M200 200 L240 200 L240 220 L200 220 Z"
      fill="#ffb300"
      stroke="none"
    />
    {/* T face */}
    <g>
      <rect
        x="30"
        y="40"
        width="140"
        height="40"
        fill="#b71c1c"
        stroke="#222"
        strokeWidth="6"
      />
      <rect
        x="90"
        y="80"
        width="40"
        height="140"
        fill="#b71c1c"
        stroke="#222"
        strokeWidth="6"
      />
    </g>
    {/* A face */}
    <g>
      <polygon
        points="180,220 200,80 240,80 260,220 240,200 200,200"
        fill="#b71c1c"
        stroke="#222"
        strokeWidth="6"
      />
      <rect x="210" y="150" width="40" height="20" fill="#fff" stroke="none" />{" "}
      {/* A crossbar */}
    </g>
  </svg>
  );
}
