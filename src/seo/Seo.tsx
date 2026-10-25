import { Helmet } from "react-helmet-async";
import { SITE_NAME, type SeoData } from "./buildSeo";

/**
 * Renders a route's SEO tags into <head> via react-helmet-async. Drives
 * client-side (SPA navigation) head updates; the server render function injects
 * the equivalent tags into the raw HTML for the first paint. Both consume the
 * same SeoData from buildSeo so they can't drift.
 */
export default function Seo({ data }: { data: SeoData }) {
  const { title, description, canonical, ogImage, ogType, noindex, jsonLd } =
    data;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {(jsonLd ?? []).map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
