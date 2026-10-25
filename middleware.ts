// Vercel Routing Middleware runs BEFORE the filesystem/cache, so it's the only
// place that can intercept "/" (which otherwise serves the static index.html
// shell). SEO routes are rewritten to /api/render, which injects real meta +
// content into the HTML. Everything else falls through to the normal SPA.
//
// Emits the raw Vercel middleware protocol headers directly instead of using
// @vercel/functions helpers — the package fails to bundle/resolve in both the
// Edge and Node middleware runtimes here, and this has zero dependencies.

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

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const p = url.pathname;
  const isSeo = EXACT[p] === true || PREFIXES.some(pre => p.startsWith(pre));

  if (!isSeo) {
    // Continue to normal routing (filesystem / SPA rewrite).
    return new Response(null, { headers: { "x-middleware-next": "1" } });
  }

  const dest = new URL("/api/render", url);
  dest.searchParams.set("p", p);
  return new Response(null, {
    headers: { "x-middleware-rewrite": dest.toString() },
  });
}

export const config = {
  // Skip /api (the render target itself lives there — avoids a rewrite loop).
  matcher: ["/((?!api/).*)"],
};
