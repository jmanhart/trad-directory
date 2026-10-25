import { fetchCityForSeo } from "../_seo/fetchCity";

// JSON city data for the SPA CityPage: resolves /city/:slug to the city and its
// artists + shops. Shares the resolver with the server render (api/render).

interface CityReq {
  query?: Record<string, string | string[] | undefined>;
}
interface CityRes {
  setHeader(name: string, value: string): void;
  status(code: number): CityRes;
  json(body: unknown): void;
}

export default async function handler(req: CityReq, res: CityRes) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const slug = typeof req.query?.slug === "string" ? req.query.slug : "";
  if (!slug) {
    res.status(400).json({ error: "City slug is required" });
    return;
  }
  try {
    const city = await fetchCityForSeo(slug);
    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).json({ result: city });
  } catch (err) {
    console.error("[api/city/[slug]]", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
