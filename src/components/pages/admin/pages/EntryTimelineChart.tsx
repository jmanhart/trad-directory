import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";
import styles from "./EntryTimelineChart.module.css";
import type { EntityKey, Range, Mode } from "./timelineControls";

const baseUrl = import.meta.env.VITE_API_URL || "/api";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Year view shows 12 whole months plus the current partial month -> 13 ticks.
const YEAR_MONTHS = 13;

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

/** Daily buckets over the last `days`, local time, labeled "MMM D". */
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
    labels[i] = `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
  }
  return { labels, counts };
}

/** Monthly buckets over the last `months`, labeled "MMM 'YY" so the year
 * view's axis reads month-based. */
function bucketMonthly(
  isoDates: string[],
  months: number
): { labels: string[]; counts: number[] } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const counts = new Array<number>(months).fill(0);
  for (const iso of isoDates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const idx =
      (d.getFullYear() - start.getFullYear()) * 12 +
      (d.getMonth() - start.getMonth());
    if (idx >= 0 && idx < months) counts[idx] += 1;
  }

  const labels = new Array<string>(months);
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    labels[i] = `${MONTH_ABBR[d.getMonth()]} '${String(d.getFullYear()).slice(
      2
    )}`;
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

/**
 * Axis max that sits one comfortable step above the data so bars/lines never
 * touch the top gridline. Small integer counts get exactly one extra gridline
 * (e.g. 3 -> 4); larger ranges round up to a nice 1/1.2/1.5/2/2.5/... x 10^n
 * value. Returns undefined for all-zero data so echarts keeps its default.
 */
function axisMaxWithHeadroom(dataMax: number): number | undefined {
  if (!Number.isFinite(dataMax) || dataMax <= 0) return undefined;
  if (dataMax < 10) return Math.floor(dataMax) + 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));
  const normalized = dataMax / magnitude;
  const niceFractions = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (const fraction of niceFractions) {
    if (fraction > normalized) return fraction * magnitude;
  }
  return 10 * magnitude;
}

interface EntryTimelineChartProps {
  entity: EntityKey;
  range: Range;
  mode: Mode;
}

export default function EntryTimelineChart({
  entity,
  range,
  mode,
}: EntryTimelineChartProps) {
  const [entries, setEntries] = useState<Record<EntityKey, string[]>>(
    EMPTY_ENTRIES
  );
  const [totals, setTotals] = useState<Record<EntityKey, number>>(EMPTY_TOTALS);

  const chartElRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  // Fetch a ~13-month window on mount (days=400 fully covers 12 months for the
  // year view), then silently refresh when the tab regains focus. Refetching
  // re-buckets against the current date so counts stay current across midnight.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`${baseUrl}/entryTimeline?days=400`)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: unknown) => {
          if (cancelled) return;
          setEntries(readEntries(data));
          setTotals(readTotals(data));
        })
        .catch((e: unknown) => {
          // Keep the last good chart on failure.
          if (!cancelled) console.error("entryTimeline load failed", e);
        });
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const { labels, counts, cumulative } = useMemo(() => {
    const { labels, counts } =
      range === 365
        ? bucketMonthly(entries[entity], YEAR_MONTHS)
        : bucketDaily(entries[entity], range);
    const windowTotal = counts.reduce((a, b) => a + b, 0);
    const entityTotal = totals[entity] || windowTotal;
    // Cumulative "total to date": start from the count that existed before the
    // window (entityTotal minus what was added within it) and add each bucket,
    // so the line ends at the entity's true current total.
    const baseline = Math.max(entityTotal - windowTotal, 0);
    const cumulative: number[] = [];
    let running = baseline;
    for (const c of counts) {
      running += c;
      cumulative.push(running);
    }
    return { labels, counts, cumulative };
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

  // Push data/theme into the chart whenever the series changes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const primary = cssVar("--color-primary", "#9c0101");
    const textSecondary = cssVar("--color-text-secondary", "#6b7280");
    const border = cssVar("--color-border", "#e5e7eb");
    const surface = cssVar("--color-surface", "#ffffff");
    const textPrimary = cssVar("--color-text-primary", "#141414");

    const isTotal = mode === "total";
    const seriesMax = Math.max(0, ...(isTotal ? cumulative : counts));
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
        max: axisMaxWithHeadroom(seriesMax),
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

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chart} ref={chartElRef} />
    </div>
  );
}
