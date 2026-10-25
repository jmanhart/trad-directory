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

// ── Entity pages (resolved server-side from Supabase) ──────────────────────
// Inputs carry an already-resolved `slug` (DB slug or name-id fallback) so the
// builders stay pure.

function locString(
  city?: string | null,
  state?: string | null,
  country?: string | null
): string {
  return [city, state || country].filter(Boolean).join(", ");
}

export interface ArtistSeoInput {
  id: number;
  name: string;
  slug: string;
  instagram: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  shopName: string | null;
}

export function seoArtist(a: ArtistSeoInput): SeoData {
  const loc = locString(a.city, a.state, a.country);
  const title = `${a.name}${a.city ? `, ${a.city}` : ""} — Traditional Tattoo Artist | ${SITE_NAME}`;
  const description =
    `${a.name} is a traditional tattoo artist${loc ? ` based in ${loc}` : ""}` +
    `${a.shopName ? ` at ${a.shopName}` : ""}. ` +
    `${a.instagram ? `Follow @${a.instagram} and see` : "See"} their work on ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/artist/${a.slug}`);

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: a.name,
    jobTitle: "Tattoo Artist",
    url: canonical,
  };
  if (a.instagram) person.sameAs = [`https://instagram.com/${a.instagram}`];
  if (a.shopName) person.worksFor = { "@type": "Organization", name: a.shopName };
  if (a.city || a.country) {
    person.address = {
      "@type": "PostalAddress",
      ...(a.city ? { addressLocality: a.city } : {}),
      ...(a.state ? { addressRegion: a.state } : {}),
      ...(a.country ? { addressCountry: a.country } : {}),
    };
  }
  return { title, description, canonical, ogImage: DEFAULT_OG_IMAGE, ogType: "profile", jsonLd: [person] };
}

export interface ShopSeoInput {
  id: number;
  name: string;
  slug: string;
  instagram: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  artistCount: number;
}

export function seoShop(s: ShopSeoInput): SeoData {
  const loc = locString(s.city, s.state, s.country);
  const title = `${s.name}${s.city ? `, ${s.city}` : ""} — Traditional Tattoo Shop | ${SITE_NAME}`;
  const description =
    `${s.name} is a traditional tattoo shop${loc ? ` in ${loc}` : ""}` +
    `${s.artistCount ? ` with ${s.artistCount} artist${s.artistCount === 1 ? "" : "s"}` : ""}. ` +
    `See resident artists and location on ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/shop/${s.slug}`);

  const shop: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: s.name,
    url: canonical,
  };
  if (s.instagram) shop.sameAs = [`https://instagram.com/${s.instagram}`];
  if (s.address || s.city || s.country) {
    shop.address = {
      "@type": "PostalAddress",
      ...(s.address ? { streetAddress: s.address } : {}),
      ...(s.city ? { addressLocality: s.city } : {}),
      ...(s.state ? { addressRegion: s.state } : {}),
      ...(s.country ? { addressCountry: s.country } : {}),
    };
  }
  return { title, description, canonical, ogImage: DEFAULT_OG_IMAGE, ogType: "website", jsonLd: [shop] };
}

export interface CityListItem {
  name: string;
  slug: string;
}
export interface CitySeoInput {
  slug: string;
  city: string;
  state: string | null;
  country: string | null;
  artists: CityListItem[];
  shops: CityListItem[];
}

export function seoCity(c: CitySeoInput): SeoData {
  const loc = locString(c.city, c.state, c.country);
  const title = `Traditional Tattoo Artists in ${c.city}${c.state ? `, ${c.state}` : ""} | ${SITE_NAME}`;
  const description =
    `Find traditional tattoo artists and shops in ${loc}. ` +
    `${c.artists.length} artist${c.artists.length === 1 ? "" : "s"} and ` +
    `${c.shops.length} shop${c.shops.length === 1 ? "" : "s"} listed on ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/city/${c.slug}`);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Traditional tattoo artists in ${c.city}`,
    itemListElement: c.artists.slice(0, 50).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/artist/${a.slug}`),
      name: a.name,
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_ORIGIN },
      ...(c.country
        ? [{ "@type": "ListItem", position: 2, name: c.country, item: absoluteUrl("/countries") }]
        : []),
      { "@type": "ListItem", position: c.country ? 3 : 2, name: c.city, item: canonical },
    ],
  };
  return { title, description, canonical, ogImage: DEFAULT_OG_IMAGE, ogType: "website", jsonLd: [itemList, breadcrumb] };
}
