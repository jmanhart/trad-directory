import fs from "node:fs";
import path from "node:path";
import { seoHome, seoStaticPage } from "./_seo/buildSeo";
import { injectHead } from "./_seo/renderHead";

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

export default function handler(req: RenderRequest, res: RenderResponse) {
  const raw = typeof req.query?.p === "string" ? req.query.p : "/";
  const pathname = raw.split("?")[0] || "/";
  const seo = pathname === "/" ? seoHome() : seoStaticPage(pathname);

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!seo) {
    // Entity routes (artist/shop/city) get DB-driven rendering in a later
    // step. Until then — and for anything unknown — serve the plain shell so
    // the SPA renders it exactly as before (no regression).
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=86400"
    );
    res.status(200).send(shell());
    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.status(200).send(injectHead(shell(), seo));
}
