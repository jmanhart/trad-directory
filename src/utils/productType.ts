import type { ProductType } from "../types";

// A controlled option/variant name that is a garment size (S, XL, "Large",
// "2XL", ...). This is the strongest apparel signal: BigCartel size runs live
// in a product's options, so matching them avoids the false positives of
// matching bare "s"/"m"/"l" in free-text titles.
const SIZE_OPTION =
  /^(x?s|m|x{0,3}l|[2-5]xl|small|medium|large|x-?small|x-?large|xx-?large|extra[\s-]?small|extra[\s-]?large)$/;

export function hasSizeVariant(optionNames: string[]): boolean {
  return optionNames.some(n => SIZE_OPTION.test(n.trim().toLowerCase()));
}

// Apparel keywords for products without a size run in their options (e.g. a
// one-size cap, or a garment whose sizes aren't exposed).
const APPAREL =
  /\b(shirt|t-?shirts?|tees?|tank|hood|hoodie|crew[\s-]?neck|sweat(?:shirt|er)?|jacket|hats?|cap|beanies?|clothing|apparel|socks?|shorts|pants|jersey|long[\s-]?sleeve|short[\s-]?sleeve|t|small|medium|large|x-?small|x-?large|xx-?large|extra[\s-]?small|extra[\s-]?large|xs|xl|xxl|xxxl|[2-5]xl)\b/;

// Two buckets only: Apparel vs Art. Anything that isn't apparel — prints,
// flash, originals, pins, books, mugs, misc — falls into Art.
export function classifyProduct(
  name: string,
  categories: string[],
  optionNames: string[] = []
): ProductType {
  if (hasSizeVariant(optionNames)) return "apparel";
  const haystack = [name, ...categories].join(" ").toLowerCase();
  return APPAREL.test(haystack) ? "apparel" : "art";
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  apparel: "Apparel",
  art: "Art",
};

export const PRODUCT_TYPE_ORDER: ProductType[] = ["apparel", "art"];
