// CJS-safe copy of the slug helpers for the server render path. Mirrors
// src/utils/slug.ts (client) — kept inside api/ so Vercel bundles it as
// CommonJS with the function (importing the ESM src/ copy throws
// ERR_REQUIRE_ESM). The two must stay in sync; the logic is tiny and stable.

export function generateSlug(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function generateUniqueSlug(name: string, id: number): string {
  const base = generateSlug(name);
  return base ? `${base}-${id}` : String(id);
}

/** City page slug: "seattle-washington" (city + state, or + country). */
export function citySlug(cityName: string, region: string | null): string {
  const base = generateSlug(cityName);
  const reg = region ? generateSlug(region) : "";
  return reg ? `${base}-${reg}` : base;
}
