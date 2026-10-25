import { next, rewrite } from "@vercel/functions";

// Vercel Routing Middleware runs BEFORE the filesystem/cache, so it's the only
// place that can intercept "/" (which otherwise serves the static index.html
// shell). SEO routes are rewritten to /api/render, which injects real meta +
// content into the HTML. Everything else falls through to the normal SPA.

const EXACT: Record<string, true> = {
  "/": true,
  "/about": true,
  "/artists": true,
  "/shops": true,
  "/countries": true,
  "/map": true,
  "/store": true,
};
const PREFIXES = ["/artist/", "/shop/", "/city/"];

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const p = url.pathname;
  const isSeo = EXACT[p] === true || PREFIXES.some(pre => p.startsWith(pre));
  if (!isSeo) return next();

  const dest = new URL("/api/render", url);
  dest.searchParams.set("p", p);
  return rewrite(dest);
}
export const config = {
  // Node.js runtime (Edge can't bundle @vercel/functions here; also the
  // recommended runtime per Vercel). Keeps middleware on Fluid Compute.
  runtime: "nodejs",
  // Skip /api (the render target itself lives there — avoids a rewrite loop).
  matcher: ["/((?!api/).*)"],
};
