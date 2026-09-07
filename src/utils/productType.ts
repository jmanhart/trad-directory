import type { ProductType } from "../types";

// Store-set BigCartel categories are sparse (~half of products) and
// inconsistent ("shirts" vs "t-shirts" vs "tees"), so classify every product
// into a fixed set of buckets by keyword-matching its name plus whatever
// categories it does carry. First matching rule wins.
//
// Art also catches page-size dimensions in the title (e.g. "8 x 10", "11x14",
// "14×12") since prints/flash are almost always listed by size.
const DIMENSION = /\b\d{1,3}\s*[x\u00d7]\s*\d{1,3}\b/;

const RULES: { type: ProductType; pattern: RegExp }[] = [
  {
    type: "apparel",
    pattern:
      /\b(shirt|t-?shirts?|tees?|tank|hoodie|crew[\s-]?neck|sweat(?:shirt|er)?|jacket|hats?|cap|beanies?|clothing|apparel|socks?|shorts|pants|jersey|long[\s-]?sleeve|short[\s-]?sleeve|t)\b/,
  },
  {
    // Prints, flash, and original artwork bucket together as "Art".
    type: "art",
    pattern:
      /\b(prints?|poster|giclee|gicl\u00e9e|lithograph|riso|screenprint|flash|stencil|sheets?|originals?|paintings?|artwork|art|drawings?|sketch|canvas|watercolou?r|illustration)\b/,
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
  // A page-size in the title is a strong print/flash signal.
  if (DIMENSION.test(haystack)) return "art";
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return rule.type;
  }
  return "other";
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  apparel: "Apparel",
  art: "Art",
  accessories: "Accessories",
  other: "Other",
};

export const PRODUCT_TYPE_ORDER: ProductType[] = [
  "apparel",
  "art",
  "accessories",
  "other",
];
