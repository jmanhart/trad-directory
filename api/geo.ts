import type { ApiRequest, ApiResponse } from "./_utils/http";

// Approximate visitor location from Vercel's edge geo headers — no client
// permission prompt, city-level accuracy. On local dev these headers don't
// exist, so it returns nulls and the map keeps its default US-centered view.

function firstHeader(req: ApiRequest, name: string): string | null {
  const v = req.headers[name];
  if (Array.isArray(v)) return v[0] ?? null;
  return typeof v === "string" ? v : null;
}

function parseNum(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const city = firstHeader(req, "x-vercel-ip-city");
  res.status(200).json({
    lat: parseNum(firstHeader(req, "x-vercel-ip-latitude")),
    lng: parseNum(firstHeader(req, "x-vercel-ip-longitude")),
    country: firstHeader(req, "x-vercel-ip-country"),
    city: city ? decodeURIComponent(city) : null,
  });
}
