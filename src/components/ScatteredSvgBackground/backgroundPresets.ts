/**
 * BACKGROUND PRESET CONFIGURATION
 * ===============================
 * 
 * How to tweak positions, sizes, and rotation:
 * 
 * POSITION (x, y):
 *   - Use percentage strings for responsive positioning: "10%", "50%", "90%"
 *   - Use pixel strings for fixed positioning: "120px", "-50px", "200px"
 *   - Negative values are allowed (useful for bleeding off edges)
 *   - Percentages are relative to the container width/height
 * 
 * SIZE:
 *   - Always in pixels (number): 60, 80, 120, etc.
 *   - This is the width/height of the SVG (maintains aspect ratio)
 * 
 * ROTATION:
 *   - In degrees (number): 0, 15, -30, 45, etc.
 *   - Positive = clockwise, negative = counter-clockwise
 * 
 * OPACITY:
 *   - Number between 0 and 1: 0.1 (very faint), 0.3 (subtle), 0.6 (medium)
 *   - If not specified, defaults to 1.0
 *   - Combined with overallOpacity for final appearance
 * 
 * BLUR:
 *   - Optional blur in pixels: 2, 4, 8
 *   - Creates a softer, more muted effect
 *   - If not specified, no blur is applied
 * 
 * HIDE BELOW:
 *   - Optional viewport width threshold in pixels: 768, 1024, etc.
 *   - If viewport width is below this value, the item won't render
 *   - Useful for hiding items on mobile/tablet to reduce clutter
 * 
 * Z-INDEX LAYERING:
 *   - Items are rendered in array order (first = behind, last = in front)
 *   - Reorder items in the array to change layering
 * 
 * TIPS:
 *   - Use percentages for items that should scale with screen size
 *   - Use fixed pixels for items that should stay in exact positions
 *   - Mix both: e.g., x: "10%" (responsive) and y: "200px" (fixed)
 *   - For bleeding off edges, use negative values or values > 100%
 *   - Keep opacity low (0.1-0.3) for subtle backgrounds
 *   - Use blur sparingly (2-4px) for a softer look
 */

export type BgItem = {
  src: string;
  alt?: string;
  x: string; // e.g. "10%" or "120px" or "-50px"
  y: string; // e.g. "20%" or "80px" or "-30px"
  size: number; // px - width/height
  rotate: number; // degrees
  opacity?: number; // 0-1, defaults to 1
  blurPx?: number; // optional blur in pixels
  hideBelowPx?: number; // hide if viewport width < this value
};

export type BgPreset = {
  name: string;
  items: BgItem[];
  overallOpacity: number; // multiplier for all items (0-1)
};

// Default preset - subtle scattered icons
export const defaultPreset: BgPreset = {
  name: "default",
  overallOpacity: 0.6, // Brighter background effect
  items: [
    {
      src: "/FLASH/ROSE_SINGLE.svg",
      alt: "Rose",
      x: "3%",
      y: "5%",
      size: 155,
      rotate: -15,
      opacity: 1.0,
    },
    {
      src: "/FLASH/SKULL_TOPHAT.svg",
      alt: "Skull with top hat",
      x: "80%",
      y: "15%",
      size: 155,
      rotate: 25,
      opacity: 0.8,
      hideBelowPx: 768,
    },
    {
      src: "/FLASH/ANCHOR_HANDSHAKE.svg",
      alt: "Anchor handshake",
      x: "9%",
      y: "76%",
      size: 185,
      rotate: 10,
      opacity: 0.9,
    },
    {
      src: "/FLASH/EAGLE.svg",
      alt: "Eagle",
      x: "80%",
      y: "65%",
      size: 235,
      rotate: 10,
      opacity: 0.7,
      hideBelowPx: 1024,
    },
    {
      src: "/FLASH/SPARROW.svg",
      alt: "Sparrow",
      x: "50%",
      y: "3%",
      size: 130,
      rotate: 15,
      opacity: 0.9,
    },
    {
      src: "/FLASH/FLOWER_EYEBALL.svg",
      alt: "Flower eyeball",
      x: "70%",
      y: "50%",
      size: 165,
      rotate: -10,
      opacity: 0.8,
    },
    {
      src: "/FLASH/SHIP.svg",
      alt: "Ship",
      x: "17%",
      y: "10%",
      rotate: 26,
      size: 180,
      opacity: 0.7,
      hideBelowPx: 1024,
    },
    {
      src: "/FLASH/BUTTERFLY.svg",
      alt: "Butterfly",
      x: "55%",
      y: "80%",
      size: 167,
      rotate: -25,
      opacity: 0.75,
    },
    {
      src: "/FLASH/HEART_KNIFE.svg",
      alt: "Heart knife",
      x: "23%",
      y: "55%",
      size: 155,
      rotate: 0,
      opacity: 0.7,
    },
    {
      src: "/FLASH/PANTHER_HEAD.svg",
      alt: "Panther head",
      x: "84%",
      y: "35%",
      size: 180,
      rotate: -4,
      opacity: 0.75,
      hideBelowPx: 768,
    },
    {
      src: "/FLASH/WOLF.svg",
      alt: "Wolf",
      x: "10%",
      y: "35%",
      size: 185,
      rotate: 12,
      opacity: 0.7,
    },
  ],
};

// Alternative preset 1 - more spread out
export const alt1Preset: BgPreset = {
  name: "alt1",
  overallOpacity: 0.12,
  items: [
    {
      src: "/FLASH/SHIP.svg",
      alt: "Ship",
      x: "-30px",
      y: "10%",
      size: 120,
      rotate: -25,
      opacity: 0.3,
      blurPx: 2,
    },
    {
      src: "/FLASH/LIGHTHOUSE.svg",
      alt: "Lighthouse",
      x: "95%",
      y: "5%",
      size: 100,
      rotate: 20,
      opacity: 0.35,
      hideBelowPx: 768,
    },
    {
      src: "/FLASH/PANTHER_HEAD.svg",
      alt: "Panther head",
      x: "8%",
      y: "80%",
      size: 95,
      rotate: 12,
      opacity: 0.3,
    },
    {
      src: "/FLASH/BUTTERFLY.svg",
      alt: "Butterfly",
      x: "92%",
      y: "85%",
      size: 75,
      rotate: -18,
      opacity: 0.4,
    },
    {
      src: "/FLASH/DIAMOND.svg",
      alt: "Diamond",
      x: "45%",
      y: "25%",
      size: 65,
      rotate: 45,
      opacity: 0.35,
    },
  ],
};

// Alternative preset 2 - minimal and subtle
export const alt2Preset: BgPreset = {
  name: "alt2",
  overallOpacity: 0.1,
  items: [
    {
      src: "/FLASH/HEART_KNIFE.svg",
      alt: "Heart knife",
      x: "15%",
      y: "30%",
      size: 90,
      rotate: -30,
      opacity: 0.4,
    },
    {
      src: "/FLASH/WOLF.svg",
      alt: "Wolf",
      x: "80%",
      y: "60%",
      size: 105,
      rotate: 20,
      opacity: 0.3,
      hideBelowPx: 1024,
    },
    {
      src: "/FLASH/FLOWERS_SMALL.svg",
      alt: "Small flowers",
      x: "5%",
      y: "60%",
      size: 80,
      rotate: 10,
      opacity: 0.35,
    },
    {
      src: "/FLASH/SKULLWINGED.svg",
      alt: "Winged skull",
      x: "88%",
      y: "30%",
      size: 95,
      rotate: -15,
      opacity: 0.3,
    },
  ],
};

// Preset map for easy lookup
export const presets: Record<string, BgPreset> = {
  default: defaultPreset,
  alt1: alt1Preset,
  alt2: alt2Preset,
};
