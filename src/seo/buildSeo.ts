// Single source of truth for per-route SEO metadata.
//
// Pure + environment-agnostic (no React, no DOM, no browser globals) so the
// exact same builders drive BOTH the client-side <Seo> component
// (react-helmet-async, for SPA navigation) AND the server render function
// (api/render, which injects these tags into the raw HTML crawlers/scrapers
// see). Keeping one builder per route guarantees the two never disagree.

export const SITE_ORIGIN = "https://www.trad-directory.com";
export const SITE_NAME = "Trad Directory";

// TODO(seo): replace with a purpose-built 1200x630 OG image, or generate per
// listing dynamically (e.g. @vercel/og). logo.jpg is a reasonable placeholder
// so link previews aren't blank in the meantime.
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo.jpg`;

export interface SeoData {
  title: string;
  description: string;
  /** Absolute canonical URL. */
  canonical: string;
  /** Absolute image URL for OG/Twitter. */
  ogImage: string;
  ogType: "website" | "profile" | "article";
  /** When true, emit noindex (e.g. thin/search pages). */
  noindex?: boolean;
  /** JSON-LD objects rendered as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown>[];
}

/** Resolve a site-relative path (or passthrough an absolute URL) to absolute. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

// Site-wide JSON-LD: WebSite (+ SearchAction for a sitelinks search box) and
// Organization. Attached to the homepage.
function siteJsonLd(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_ORIGIN}/search-results?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/FULL-LOGO.svg`,
    },
  ];
}

export function seoHome(): SeoData {
  return {
    title: `${SITE_NAME} — Traditional Tattoo Artists & Shops Worldwide`,
    description:
      "Find traditional (American old-school) tattoo artists and shops near you. Browse 1,400+ trad tattooers across 320+ shops in 40+ countries — search by artist, shop, or city.",
    canonical: `${SITE_ORIGIN}/`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
    jsonLd: siteJsonLd(),
  };
}

interface StaticPageDef {
  title: string;
  description: string;
}

// Titles/descriptions for the fixed (non-entity) routes.
const STATIC_PAGES: Record<string, StaticPageDef> = {
  "/artists": {
    title: `All Traditional Tattoo Artists — ${SITE_NAME}`,
    description:
      "Browse every traditional tattoo artist in the directory. Find trad tattooers by location, worldwide.",
  },
  "/shops": {
    title: `Traditional Tattoo Shops — ${SITE_NAME}`,
    description:
      "Browse traditional tattoo shops worldwide. Find trad-focused studios by city and country.",
  },
  "/countries": {
    title: `Traditional Tattoo Artists by Country — ${SITE_NAME}`,
    description:
      "Explore traditional tattoo artists and shops grouped by country.",
  },
  "/about": {
    title: `About — ${SITE_NAME}`,
    description:
      "Trad Directory is a curated, worldwide directory of traditional (old-school) tattoo artists and shops.",
  },
  "/map": {
    title: `Tattoo Artist Map — ${SITE_NAME}`,
    description:
      "An interactive map of traditional tattoo artists and shops. Find trad tattooers near you.",
  },
  "/store": {
    title: `Store — ${SITE_NAME}`,
    description: "Apparel and art from traditional tattoo artists.",
  },
};

/** SEO for a fixed route, or null if the path isn't a known static page. */
export function seoStaticPage(path: string): SeoData | null {
  const def = STATIC_PAGES[path];
  if (!def) return null;
  return {
    title: def.title,
    description: def.description,
    canonical: absoluteUrl(path),
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
  };
}
