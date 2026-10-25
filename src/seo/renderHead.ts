import { SITE_NAME, type SeoData } from "./buildSeo";

// Server-side counterpart to <Seo>: turns SeoData into raw <head> HTML that the
// render function injects into index.html for the first paint (what crawlers,
// scrapers, and AI agents see without running JS). Shares SeoData with the
// client <Seo> so the two can't drift.
//
// Tags carry data-rh="true" — the attribute react-helmet-async stamps on the
// tags it manages. On client hydration helmet clears existing data-rh tags and
// re-adds its own (identical) set, so there are no duplicate meta tags.

const HELMET_ATTR = ' data-rh="true"';

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderHeadTags(seo: SeoData): string {
  const meta = (attr: string, key: string, val: string) =>
    `<meta ${attr}="${esc(key)}" content="${esc(val)}"${HELMET_ATTR} />`;

  const tags: string[] = [
    meta("name", "description", seo.description),
    `<link rel="canonical" href="${esc(seo.canonical)}"${HELMET_ATTR} />`,
    seo.noindex ? meta("name", "robots", "noindex, nofollow") : "",
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:type", seo.ogType),
    meta("property", "og:title", seo.title),
    meta("property", "og:description", seo.description),
    meta("property", "og:url", seo.canonical),
    meta("property", "og:image", seo.ogImage),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", seo.title),
    meta("name", "twitter:description", seo.description),
    meta("name", "twitter:image", seo.ogImage),
    ...(seo.jsonLd ?? []).map(
      obj =>
        `<script type="application/ld+json"${HELMET_ATTR}>${JSON.stringify(
          obj
        ).replace(/</g, "\\u003c")}</script>`
    ),
  ];

  return tags.filter(Boolean).join("\n    ");
}

/**
 * Inject SeoData into an index.html template: replace the <title> and splice
 * the meta/link/JSON-LD tags in just before </head>.
 */
export function injectHead(template: string, seo: SeoData): string {
  const withTitle = template.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title${HELMET_ATTR}>${esc(seo.title)}</title>`
  );
  return withTitle.replace(
    "</head>",
    `    ${renderHeadTags(seo)}\n  </head>`
  );
}
