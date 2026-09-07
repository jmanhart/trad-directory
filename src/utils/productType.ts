import type { ProductType } from "../types";

// A controlled option/variant name that is a garment size (S, XL, "Large",
// "2XL", ...). This is the strongest apparel signal: BigCartel size runs live
// in a product's options, so matching them avoids the false positives of
// matching bare "s"/"m"/"l" in free-text titles. Dimensions like "11x14" are
// print measurements, not sizes.
const SIZE_OPTION =
  /^(x?s|m|x{0,3}l|[2-5]xl|small|medium|large|x-?small|x-?large|xx-?large|extra[\s-]?small|extra[\s-]?large)$/;

export function hasSizeVariant(optionNames: string[]): boolean {
  return optionNames.some(n => SIZE_OPTION.test(n.trim().toLowerCase()));
}

// Page-size dimensions in a title (8 x 10, 11x14, 14×12) are a strong
// print/flash signal.
const DIMENSION = /\b\d{1,3}\s*[x\u00d7]\s*\d{1,3}\b/;

// Store-set BigCartel categories are sparse and inconsistent, so we also
// keyword-match the name + any categories it carries. First matching rule wins.
const RULES: { type: ProductType; pattern: RegExp }[] = [
  {
    type: "apparel",
    pattern:
      /\b(shirt|t-?shirts?|tees?|tank|hood|hoodie|crew[\s-]?neck|sweat(?:shirt|er)?|jacket|hats?|cap|beanies?|clothing|apparel|socks?|shorts|pants|jersey|long[\s-]?sleeve|short[\s-]?sleeve|t|small|medium|large|x-?small|x-?large|xx-?large|extra[\s-]?small|extra[\s-]?large|xs|xl|xxl|xxxl|[2-5]xl)\b/,
  },
  {
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
  categories: string[],
  optionNames: string[] = []
): ProductType {
  // A size run in the variants is the strongest apparel signal.
  if (hasSizeVariant(optionNames)) return "apparel";
  const haystack = [name, ...categories].join(" ").toLowerCase();
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
