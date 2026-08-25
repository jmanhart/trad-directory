// Shared enums/labels for the admin entries-timeline UI. Kept dependency-free
// (no echarts) so the eager AllAnalyticsPage and the lazy EntryTimelineChart
// chunk can both import these without pulling the chart bundle eagerly.

export type EntityKey = "artists" | "shops" | "cities" | "countries";

export const ENTITIES: { key: EntityKey; label: string }[] = [
  { key: "artists", label: "Artists" },
  { key: "shops", label: "Shops" },
  { key: "cities", label: "Cities" },
  { key: "countries", label: "Countries" },
];

export const RANGES = [7, 30, 90, 365] as const;
export type Range = (typeof RANGES)[number];

export const RANGE_LABELS: Record<Range, string> = {
  7: "7d",
  30: "30d",
  90: "90d",
  365: "1y",
};

export type Mode = "new" | "total";

export const MODES: { key: Mode; label: string }[] = [
  { key: "new", label: "New" },
  { key: "total", label: "Total" },
];
