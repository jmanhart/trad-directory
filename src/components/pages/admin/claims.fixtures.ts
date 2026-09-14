// Mock data for the admin Claims tab. Phase-0 experience prototype only — no
// database, no API. See CLAIM_FLOW_PLAN.md. Delete this file (and AdminClaims)
// when the real claim backend lands, or repoint AdminClaims at the API.

export type ClaimStatus = "pending" | "verified" | "rejected";
export type ClaimEntityType = "artist" | "shop";

export interface ClaimRequest {
  id: string;
  /** ISO timestamp the claim was requested. */
  createdAt: string;
  /** Email of the signed-in user making the claim. */
  userEmail: string;
  entityType: ClaimEntityType;
  entityId: number;
  listingName: string;
  /** Instagram handle on the listing being claimed (without leading @). */
  claimedHandle: string;
  /** One-time code the user was told to DM as corroborating evidence. */
  code: string;
  /** Whether the code arrived via DM (evidence for the human reviewer). */
  dmReceived: boolean;
  status: ClaimStatus;
}

const MIXED: ClaimRequest[] = [
  {
    id: "clm_01",
    createdAt: "2026-09-12T14:20:00Z",
    userEmail: "ed@sailorjerryrevival.com",
    entityType: "artist",
    entityId: 142,
    listingName: "Ed Hardy",
    claimedHandle: "edhardyofficial",
    code: "TRAD-7F3K",
    dmReceived: true,
    status: "pending",
  },
  {
    id: "clm_02",
    createdAt: "2026-09-12T09:05:00Z",
    userEmail: "rose@blackanchortattoo.com",
    entityType: "shop",
    entityId: 58,
    listingName: "Black Anchor Tattoo",
    claimedHandle: "blackanchortattoo",
    code: "TRAD-9QW2",
    dmReceived: false,
    status: "pending",
  },
  {
    id: "clm_03",
    createdAt: "2026-09-10T18:42:00Z",
    userEmail: "grime@stateofgrace.jp",
    entityType: "artist",
    entityId: 87,
    listingName: "Horitomo",
    claimedHandle: "horitomo_stateofgrace",
    code: "TRAD-2LM8",
    dmReceived: true,
    status: "verified",
  },
  {
    id: "clm_04",
    createdAt: "2026-09-09T11:15:00Z",
    userEmail: "notreallythem@gmail.com",
    entityType: "artist",
    entityId: 203,
    listingName: "Chris Garver",
    claimedHandle: "chrisgarver",
    code: "TRAD-5XR1",
    dmReceived: false,
    status: "rejected",
  },
];

const ALL_PENDING: ClaimRequest[] = [
  {
    id: "clm_10",
    createdAt: "2026-09-13T08:12:00Z",
    userEmail: "kelly@truebladetattoo.com",
    entityType: "shop",
    entityId: 91,
    listingName: "True Blade Tattoo",
    claimedHandle: "truebladetattoo",
    code: "TRAD-3HB7",
    dmReceived: true,
    status: "pending",
  },
  {
    id: "clm_11",
    createdAt: "2026-09-13T07:40:00Z",
    userEmail: "valerie@gmail.com",
    entityType: "artist",
    entityId: 176,
    listingName: "Valerie Vargas",
    claimedHandle: "valeriemodernclassic",
    code: "TRAD-8KD4",
    dmReceived: false,
    status: "pending",
  },
  {
    id: "clm_12",
    createdAt: "2026-09-12T22:03:00Z",
    userEmail: "mike@rockofagestattoo.com",
    entityType: "artist",
    entityId: 44,
    listingName: "Mike Rubendall",
    claimedHandle: "mikerubendall",
    code: "TRAD-1PN9",
    dmReceived: true,
    status: "pending",
  },
];

export const CLAIM_FIXTURE_SETS = {
  mixed: MIXED,
  allPending: ALL_PENDING,
  empty: [] as ClaimRequest[],
};

export type ClaimFixtureSet = keyof typeof CLAIM_FIXTURE_SETS;
