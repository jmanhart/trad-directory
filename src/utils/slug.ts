/**
 * Generates a URL-safe slug from a name string
 * Examples:
 *   "John Doe" -> "john-doe"
 *   "Happyland Tattoo" -> "happyland-tattoo"
 *   "John's Tattoo Shop" -> "johns-tattoo-shop"
 */
export function generateSlug(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return (
    name
      .toLowerCase()
      .trim()
      // Replace apostrophes and other special chars with nothing
      .replace(/['"]/g, "")
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, "")
      // Replace multiple consecutive hyphens with a single hyphen
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length to 100 characters for SEO
      .slice(0, 100)
  );
}

/**
 * Generates a unique slug by appending the ID if a duplicate exists
 * Format: "name-slug-123" (where 123 is the ID)
 */
export function generateUniqueSlug(name: string, id: number): string {
  const baseSlug = generateSlug(name);
  if (!baseSlug) {
    return String(id);
  }
  return `${baseSlug}-${id}`;
}

/**
 * Extracts ID from a slug if it's in the format "slug-123"
 * Returns null if no ID is found
 */
export function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Checks if a string is a numeric ID (for backward compatibility)
 */
export function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}
