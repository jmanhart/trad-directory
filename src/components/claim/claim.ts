// Phase-0 experience prototype for the user-facing "claim your listing" flow.
//
// Everything here is MOCK — no DB, no API, no real ownership. A claim's status
// lives in component state for the length of a page visit; a dev-only `?claim=`
// query override seeds the initial state so every visual state is smoke-testable
// without a backend (the user-facing analog of the admin Claims tab's mock-set
// toolbar). See CLAIM_FLOW_PLAN.md. Delete this, or repoint the components at
// the real API, when the Phase-3 claim backend lands.

export type ClaimStatus = "unclaimed" | "pending" | "verified" | "rejected";
export type ClaimEntityType = "artist" | "shop";

const CLAIM_STATUSES: readonly ClaimStatus[] = [
  "unclaimed",
  "pending",
  "verified",
  "rejected",
];

/**
 * Dev-only: seed an initial claim status from the URL (`?claim=verified`).
 * Unknown or missing values fall back to "unclaimed". Only meaningful while
 * the flow is mocked; the real backend replaces this with fetched state.
 */
export function readClaimStatusOverride(search: string): ClaimStatus {
  const value = new URLSearchParams(search).get("claim");
  return CLAIM_STATUSES.includes(value as ClaimStatus)
    ? (value as ClaimStatus)
    : "unclaimed";
}

/** Generate a mock verification code, e.g. "TRAD-7F3K". */
export function generateClaimCode(): string {
  // Crockford-ish alphabet: no ambiguous 0/O/1/I so a handwritten DM is legible.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TRAD-${suffix}`;
}

// --- Mock data for the account "Your claims" section -----------------------

export type AccountClaimStatus = Exclude<ClaimStatus, "unclaimed">;

export interface AccountClaim {
  id: string;
  listingName: string;
  entityType: ClaimEntityType;
  /** Instagram handle claimed (without leading @). */
  handle: string;
  status: AccountClaimStatus;
  /** ISO timestamp the claim was submitted. */
  submittedAt: string;
  /** Present only when rejected. */
  reason?: string;
}

export const MOCK_ACCOUNT_CLAIMS: AccountClaim[] = [
  {
    id: "c_1001",
    listingName: "Sailor's Grave Tattoo",
    entityType: "shop",
    handle: "sailorsgrave",
    status: "verified",
    submittedAt: "2026-09-02T15:20:00Z",
  },
  {
    id: "c_1002",
    listingName: "Marta Kędzierska",
    entityType: "artist",
    handle: "marta.trad",
    status: "pending",
    submittedAt: "2026-09-11T09:05:00Z",
  },
  {
    id: "c_1003",
    listingName: "Old Line Tattoo",
    entityType: "shop",
    handle: "oldlineink",
    status: "rejected",
    submittedAt: "2026-08-24T18:40:00Z",
    reason: "The DM'd code didn't match. Regenerate a code and try again.",
  },
];

export const ACCOUNT_CLAIM_STATUS_LABEL: Record<AccountClaimStatus, string> = {
  pending: "Pending review",
  verified: "Verified owner",
  rejected: "Declined",
};
