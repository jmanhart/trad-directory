import fs from "node:fs";
import path from "node:path";
import {
  seoHome,
  seoStaticPage,
  seoArtist,
  seoShop,
} from "./_seo/buildSeo";
import { injectHead } from "./_seo/renderHead";
import {
  renderArtistBody,
  renderShopBody,
  injectBody,
} from "./_seo/renderContent";
import { fetchArtistForSeo, fetchShopForSeo } from "./_seo/fetchEntity";

// Serves the SEO routes that middleware.ts rewrites here. Reads the built
// index.html shell (bundled via vercel.json functions.includeFiles), injects
// the route's meta/OG/JSON-LD, and returns it so crawlers/scrapers/AI agents
// get real HTML on the first byte. The SPA still boots and takes over for users.

// The deployed function's working directory isn't guaranteed, so try a few
// locations for the bundled shell.
function shellCandidates(): string[] {
  return [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "..", "dist", "index.html"),
    path.join(__dirname, "..", "..", "dist", "index.html"),
    "/var/task/dist/index.html",
  ];
}

let cachedShell: string | null = null;
function shell(): string {
  if (cachedShell != null) return cachedShell;
  const tried = shellCandidates();
  for (const candidate of tried) {
    try {
      cachedShell = fs.readFileSync(candidate, "utf8");
      return cachedShell;
    } catch {
      // try next candidate
    }
  }
  throw new Error(`index.html shell not found. Tried: ${tried.join(", ")}`);
}

interface RenderRequest {
  query?: Record<string, string | string[] | undefined>;
}
interface RenderResponse {
  setHeader(name: string, value: string): void;
  status(code: number): RenderResponse;
  send(body: string): void;
}

const CACHE_PAGE = "public, s-maxage=3600, stale-while-revalidate=86400";
const CACHE_SHELL = "public, s-maxage=300, stale-while-revalidate=86400";

function matchPrefix(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/\/+$/, "");
  return rest ? decodeURIComponent(rest) : null;
}

export default async function handler(
  req: RenderRequest,
  res: RenderResponse
) {
  const raw = typeof req.query?.p === "string" ? req.query.p : "/";
  const pathname = raw.split("?")[0] || "/";
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    const staticSeo = pathname === "/" ? seoHome() : seoStaticPage(pathname);
    if (staticSeo) {
      res.setHeader("Cache-Control", CACHE_PAGE);
      res.status(200).send(injectHead(shell(), staticSeo));
      return;
    }

    const artistSlug = matchPrefix(pathname, "/artist/");
    if (artistSlug) {
      const r = await fetchArtistForSeo(artistSlug);
      if (r) {
        res.setHeader("Cache-Control", CACHE_PAGE);
        res
          .status(200)
          .send(
            injectBody(
              injectHead(shell(), seoArtist(r.seo)),
              renderArtistBody(r.seo, r.shopSlug)
            )
          );
        return;
      }
    }

    const shopSlug = matchPrefix(pathname, "/shop/");
    if (shopSlug) {
      const r = await fetchShopForSeo(shopSlug);
      if (r) {
        res.setHeader("Cache-Control", CACHE_PAGE);
        res
          .status(200)
          .send(
            injectBody(
              injectHead(shell(), seoShop(r.seo)),
              renderShopBody(r.seo, r.artists)
            )
          );
        return;
      }
    }

    // Unknown route or entity not found -> plain shell; the SPA handles it.
    res.setHeader("Cache-Control", CACHE_SHELL);
    res.status(200).send(shell());
  } catch (err) {
    // An SEO/DB failure must NEVER 500 the page — fall back to the plain shell
    // so the SPA still renders. (This is the guard the first outage lacked.)
    console.error("[render] error for", pathname, err);
    try {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(shell());
    } catch {
      res.status(500).send("");
    }
  }
}
