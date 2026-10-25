import { useLocation } from "react-router-dom";
import Seo from "./Seo";
import { seoStaticPage } from "./buildSeo";

/**
 * Centralized client-side SEO for the fixed (non-entity) routes — About, the
 * list pages, map, store. The homepage renders its own <Seo> (seoHome), and
 * entity routes (artist/shop/city) render theirs with fetched data, so this
 * returns null for anything that isn't a known static page.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const data = seoStaticPage(pathname);
  if (!data) return null;
  return <Seo data={data} />;
}
