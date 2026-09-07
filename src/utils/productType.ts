import type { ProductType } from "../types";

// Store-set BigCartel categories are sparse (~half of products) and
// inconsistent ("shirts" vs "t-shirts" vs "tees"), so classify every product
// into a fixed set of buckets by keyword-matching its name plus whatever
// categories it does carry. First matching rule wins.
const RULES: { type: ProductType; pattern: RegExp }[] = [
  {
    type: "apparel",
    pattern:
      /\b(shirt|t-?shirts?|tee|tees|hoodie|crewneck|sweat(?:shirt|er)?|jacket|hats?|cap|beanie|clothing|apparel|sock|shorts|pants|jersey)\b/,
  },
  {
    type: "prints",
    pattern: /\b(prints?|poster|giclee|gicl\u00e9e|lithograph|riso|screenprint)\b/,
  },
  {
    type: "flash",
    pattern: /\b(flash|stencil)\b/,
  },
  {
    type: "original",
    pattern:
      /\b(original|paintings?|artwork|drawing|sketch|canvas|watercolou?r)\b/,
  },
  {
    type: "accessories",
    pattern:
      /\b(pins?|stickers?|patch|patches|keychain|magnet|jewel(?:ry|lery)|ring|necklace|candle|mug|towel|blanket|book|zine|pennant|flag)\b/,
  },
];

export function classifyProduct(
  name: string,
  categories: string[]
): ProductType {
  const haystack = [name, ...categories].join(" ").toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return rule.type;
  }
  return "other";
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  apparel: "Apparel",
  prints: "Prints",
  flash: "Flash",
  original: "Original art",
  accessories: "Accessories",
  other: "Other",
};

export const PRODUCT_TYPE_ORDER: ProductType[] = [
  "apparel",
  "prints",
  "flash",
  "original",
  "accessories",
  "other",
];
