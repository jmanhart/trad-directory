// Single source of truth for the directory's own brand identifiers.
//
// The repo currently references two Instagram handles (the nav links to
// `trad_tattoo_directory`, the About page frames `trad_directory` as the
// "message me" account). The claim flow tells owners to DM a verification
// code, so it points at the DM-framed handle. Centralized here so there is
// one place to reconcile the two if the brand handle is ever unified.
export const DIRECTORY_INSTAGRAM_HANDLE = "trad_directory";

/** Deep link that opens an Instagram DM compose to the directory account. */
export const DIRECTORY_INSTAGRAM_DM_URL = `https://ig.me/m/${DIRECTORY_INSTAGRAM_HANDLE}`;

/** Public profile URL for the directory account. */
export const DIRECTORY_INSTAGRAM_URL = `https://www.instagram.com/${DIRECTORY_INSTAGRAM_HANDLE}/`;
