import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";
import styles from "./EntryTimelineChart.module.css";

type EntityKey = "artists" | "shops" | "cities" | "countries";

const ENTITIES: { key: EntityKey; label: string }[] = [
  { key: "artists", label: "Artists" },
  { key: "shops", label: "Shops" },
  { key: "cities", label: "Cities" },
  { key: "countries", label: "Countries" },
];

const RANGES = [7, 30, 90, 365] as const;
type Range = (typeof RANGES)[number];

const RANGE_LABELS: Record<Range, string> = {
  7: "7d",
  30: "30d",
  90: "90d",
  365: "1y",
};

const baseUrl = import.meta.env.VITE_API_URL || "/api";

const EMPTY_ENTRIES: Record<EntityKey, string[]> = {
  artists: [],
  shops: [],
  cities: [],
  countries: [],
};

const EMPTY_TOTALS: Record<EntityKey, number> = {
  artists: 0,
  shops: 0,
  cities: 0,
  countries: 0,
};

type Mode = "new" | "total";
const MODES: { key: Mode; label: string }[] = [
  { key: "new", label: "New" },
  { key: "total", label: "Total" },
];

/** Coerce an unknown value into a string[] (drops non-strings). */
function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

/** Defensively read the { entries: { <entity>: string[] } } payload. */
function readEntries(data: unknown): Record<EntityKey, string[]> {
  const out: Record<EntityKey, string[]> = {
    artists: [],
    shops: [],
    cities: [],
    countries: [],
  };
  if (!data || typeof data !== "object" || !("entries" in data)) return out;
  const entries = data.entries;
  if (!entries || typeof entries !== "object") return out;
  if ("artists" in entries) out.artists = stringArray(entries.artists);
  if ("shops" in entries) out.shops = stringArray(entries.shops);
  if ("cities" in entries) out.cities = stringArray(entries.cities);
  if ("countries" in entries) out.countries = stringArray(entries.countries);
  return out;
}

/** Defensively read the { totals: { <entity>: number } } payload. */
function readTotals(data: unknown): Record<EntityKey, number> {
  const out: Record<EntityKey, number> = { ...EMPTY_TOTALS };
  if (!data || typeof data !== "object" || !("totals" in data)) return out;
  const totals = data.totals;
  if (!totals || typeof totals !== "object") return out;
  if ("artists" in totals && typeof totals.artists === "number")
    out.artists = totals.artists;
  if ("shops" in totals && typeof totals.shops === "number")
    out.shops = totals.shops;
  if ("cities" in totals && typeof totals.cities === "number")
    out.cities = totals.cities;
  if ("countries" in totals && typeof totals.countries === "number")
    out.countries = totals.countries;
  return out;
}

/** Bucket ISO timestamps into per-day counts over the last `days`, local time. */
function bucketDaily(
  isoDates: string[],
  days: number
): { labels: string[]; counts: number[] } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const counts = new Array<number>(days).fill(0);
  for (const iso of isoDates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    const idx = Math.round((d.getTime() - start.getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) counts[idx] += 1;
  }

  const labels = new Array<string>(days);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    labels[i] = `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return { labels, counts };
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export default function EntryTimelineChart() {
  const [entity, setEntity] = useState<EntityKey>("artists");
  const [range, setRange] = useState<Range>(30);
  const [entries, setEntries] = useState<Record<EntityKey, string[]>>(
    EMPTY_ENTRIES
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<EntityKey, number>>(EMPTY_TOTALS);
  const [mode, setMode] = useState<Mode>("new");

  const chartElRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  // Fetch the full 365-day (max) window on mount, then silently refresh when
  // the tab regains focus. Refetching re-buckets against the current date, so
  // counts stay current and a page left open across midnight rolls forward.
  useEffect(() => {
    let cancelled = false;
    const load = (silent = false) => {
      if (!silent) setLoading(true);
      fetch(`${baseUrl}/entryTimeline?days=365`)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: unknown) => {
          if (cancelled) return;
          setEntries(readEntries(data));
          setTotals(readTotals(data));
          setError(null);
        })
        .catch((e: unknown) => {
          // Keep the last good chart on a background refresh failure.
          if (!cancelled && !silent) {
            setError(e instanceof Error ? e.message : "load failed");
          }
        })
        .finally(() => {
          if (!cancelled && !silent) setLoading(false);
        });
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const { labels, counts, cumulative, windowTotal, entityTotal } = useMemo(() => {
    const { labels, counts } = bucketDaily(entries[entity], range);
    const windowTotal = counts.reduce((a, b) => a + b, 0);
    const entityTotal = totals[entity] || windowTotal;
    // Cumulative "total to date": start from the count that existed before the
    // window (entityTotal minus what was added within it) and add each day, so
    // the line ends at the entity's true current total.
    const baseline = Math.max(entityTotal - windowTotal, 0);
    const cumulative: number[] = [];
    let running = baseline;
    for (const c of counts) {
      running += c;
      cumulative.push(running);
    }
    return { labels, counts, cumulative, windowTotal, entityTotal };
  }, [entries, totals, entity, range]);

  // Create the chart instance once, keep it sized to the container.
  useEffect(() => {
    if (!chartElRef.current) return;
    const chart = echarts.init(chartElRef.current);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartElRef.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // Push data/theme into the chart whenever the bars change.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const primary = cssVar("--color-primary", "#9c0101");
    const textSecondary = cssVar("--color-text-secondary", "#6b7280");
    const border = cssVar("--color-border", "#e5e7eb");
    const surface = cssVar("--color-surface", "#ffffff");
    const textPrimary = cssVar("--color-text-primary", "#141414");

    const isTotal = mode === "total";
    const option: EChartsOption = {
      grid: { top: 12, right: 12, bottom: 24, left: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: isTotal ? "line" : "shadow" },
        backgroundColor: surface,
        borderColor: border,
        textStyle: { color: textPrimary },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: textSecondary, fontSize: 11, hideOverlap: true },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: border } },
        axisLabel: { color: textSecondary, fontSize: 11 },
      },
      series: [
        isTotal
          ? {
              type: "line",
              name: "Total",
              data: cumulative,
              smooth: true,
              showSymbol: false,
              lineStyle: { color: primary, width: 2 },
              areaStyle: { color: primary, opacity: 0.1 },
            }
          : {
              type: "bar",
              name: "Entries",
              data: counts,
              itemStyle: { color: primary, borderRadius: [3, 3, 0, 0] },
              barMaxWidth: 22,
            },
      ],
    };
    chart.setOption(option, true);
  }, [labels, counts, cumulative, mode]);

  const subtitle = loading
    ? "Loading…"
    : error
      ? "Couldn't load the timeline"
      : mode === "total"
        ? `${entityTotal.toLocaleString()} ${entity} total`
        : `${windowTotal.toLocaleString()} ${entity} added in the last ${range} days`;

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Entries Over Time</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={entity}
            onChange={e => setEntity(e.target.value as EntityKey)}
            aria-label="Entity type"
          >
            {ENTITIES.map(o => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <div className={styles.ranges} role="group" aria-label="Time range">
            {RANGES.map(r => (
              <button
                key={r}
                type="button"
                className={`${styles.rangeBtn} ${
                  range === r ? styles.rangeActive : ""
                }`}
                onClick={() => setRange(r)}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <div className={styles.ranges} role="group" aria-label="Series mode">
            {MODES.map(m => (
              <button
                key={m.key}
                type="button"
                className={`${styles.rangeBtn} ${
                  mode === m.key ? styles.rangeActive : ""
                }`}
                onClick={() => setMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className={styles.chart} ref={chartElRef} />
    </section>
  );
}
