import {
  SITE_ORIGIN,
  type ArtistSeoInput,
  type ShopSeoInput,
  type CitySeoInput,
  type CityListItem,
} from "./buildSeo";

// Renders the crawlable content block injected into <div id="root"> for entity
// pages. React's createRoot replaces this on mount, so users get the full SPA
// while crawlers/AI (no JS) get real, semantic HTML content.

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loc(city?: string | null, state?: string | null, country?: string | null): string {
  return [city, state, country].filter(Boolean).map(String).map(esc).join(", ");
}

function igLink(handle: string): string {
  return `<a href="https://instagram.com/${esc(handle)}" rel="noopener nofollow">@${esc(handle)}</a>`;
}

export function renderArtistBody(a: ArtistSeoInput, shopSlug: string | null): string {
  const l = loc(a.city, a.state, a.country);
  const shop = a.shopName
    ? shopSlug
      ? `<a href="${SITE_ORIGIN}/shop/${esc(shopSlug)}">${esc(a.shopName)}</a>`
      : esc(a.shopName)
    : "";
  return `<main class="seo-content"><article>
  <h1>${esc(a.name)}</h1>
  <p>Traditional tattoo artist${l ? ` based in ${l}` : ""}.</p>
  ${shop ? `<p>Works at ${shop}.</p>` : ""}
  ${a.instagram ? `<p>Instagram: ${igLink(a.instagram)}</p>` : ""}
</article></main>`;
}

export function renderShopBody(s: ShopSeoInput, artists: CityListItem[]): string {
  const l = loc(s.city, s.state, s.country);
  const list = artists
    .map(
      a =>
        `<li><a href="${SITE_ORIGIN}/artist/${esc(a.slug)}">${esc(a.name)}</a></li>`
    )
    .join("\n    ");
  return `<main class="seo-content"><article>
  <h1>${esc(s.name)}</h1>
  <p>Traditional tattoo shop${l ? ` in ${l}` : ""}.</p>
  ${s.address ? `<p>${esc(s.address)}</p>` : ""}
  ${s.instagram ? `<p>Instagram: ${igLink(s.instagram)}</p>` : ""}
  ${artists.length ? `<h2>Artists</h2>\n  <ul>\n    ${list}\n  </ul>` : ""}
</article></main>`;
}

function listItems(items: CityListItem[], base: string): string {
  return items
    .map(i => `<li><a href="${SITE_ORIGIN}${base}${esc(i.slug)}">${esc(i.name)}</a></li>`)
    .join("\n    ");
}

export function renderCityBody(c: CitySeoInput): string {
  const l = loc(c.city, c.state, c.country);
  return `<main class="seo-content"><article>
  <h1>Traditional Tattoo Artists in ${esc(c.city)}${c.state ? `, ${esc(c.state)}` : ""}</h1>
  <p>Find traditional tattoo artists and shops in ${l}.</p>
  ${c.artists.length ? `<h2>Artists</h2>\n  <ul>\n    ${listItems(c.artists, "/artist/")}\n  </ul>` : ""}
  ${c.shops.length ? `<h2>Shops</h2>\n  <ul>\n    ${listItems(c.shops, "/shop/")}\n  </ul>` : ""}
</article></main>`;
}

/** Inject a server-rendered content block into the shell's #root. */
export function injectBody(template: string, bodyHtml: string): string {
  return template.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${bodyHtml}</div>`
  );
}
