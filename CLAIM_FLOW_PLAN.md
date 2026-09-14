# Claim Your Listing — Battle Plan

Accounts + favorites + artist/shop **claim-your-listing** for trad-directory.

## Goal

Let a real artist or shop owner prove they control a directory listing's
Instagram handle and become its **verified owner** — with John's involvement
reduced to a single approve tap. Ship the _experience_ first as unwired mock
UI, then wire it to data.

---

## Current state (as of 2026-09-13)

**Auth scaffolding exists but is dormant.** Committed to `main`
(`95a9b30` "Adding in the bones for accounts", `c36a67e` "Security hardening"):

- DB (remote baseline, live): `profiles` (FK → `auth.users`, cascade),
  `saved_artists` (`UNIQUE(user_id, artist_id)`), correct RLS, `handle_new_user`
  trigger auto-creating a profile on signup.
- Frontend: `AuthContext` (magic link via `signInWithOtp`), `LoginPage`,
  `AccountPage`, `SavedPage`, `useSavedArtists`, `useProfile`. `AuthProvider`
  mounted in `main.tsx`.
- **Gap:** `App.tsx` never mounts `/login`, `/account`, `/saved`, or
  `/auth/callback` — the components are unreachable. `AUTH_SETUP.md` documents
  the intended wiring.
- **Favorites is artists-only:** no `saved_shops` table, hook, or UI.

## Why verification is human-in-the-loop (locked decision)

- **"Login with Instagram" is dead** — Meta deprecated Instagram Basic Display
  (Dec 2024). Supabase doesn't list Instagram as a provider.
- **Auto-matching a DM code to a handle is impossible.** The inbound IG DM
  webhook delivers an opaque per-conversation `IGSID`; there is **no Graph API
  to resolve an arbitrary sender's IGSID → username.** You'd learn "some opaque
  ID sent the right code," never "@thehandle sent it."
- `instagram_business_manage_messages` is **App-Review-gated to "customer
  service"** use — a claim flow risks rejection.
- **Therefore:** the DM code is _corroborating evidence a human glances at_, not
  a machine-matched gate. John approves in admin. Optional brittle auto-fetch
  (scrape bio for code via Apify/RapidAPI) is a _future additive layer_, never
  the foundation.

---

## Build approach (agreed)

**Mock-first, in admin, unwired — lock the experience before touching data.**

- Start in the **admin** surface: a `claims` tab drops into the proven
  `AdminAllData` tabbed shell (existing `TabType` union + `activeTab === …`
  blocks + `embeddedTab`) — zero new layout risk.
- Also mock the **user-facing** entry (claim button → code modal →
  waiting/outcome), because that's what makes the feature feel trustworthy.
- **Switchable mock states**, not one static screen: a fixture array driving
  `pending | verified | rejected | empty` so every visual state is
  smoke-tested in one sitting.
- **Zero DB, zero auth, zero webhook this phase.** Pure components + fixtures.
  No `claim_requests` table yet. Keeps it reversible if the UX doesn't feel
  right.
- **Theme-verify** the mocked UI across every variant before calling the
  experience "locked."

**Branch & feature flag**

- Work lives on `feat/accounts-claim-flow`.
- Gated by the `accounts` flag in `src/lib/flags.ts` (build-time, reads
  `VITE_FEATURE_ACCOUNTS`). Set `VITE_FEATURE_ACCOUNTS=true` in local `.env` +
  Vercel _preview_; leave unset in _production_ so the WIP is dead-code-
  eliminated from the prod bundle.
- The `claims` admin tab is already behind the `ProtectedRoute` admin gate; the
  flag's real job is hiding the **public** claim surfaces (claim buttons,
  account routes) until launch.

---

## Claim flow UX (spec)

### Account basics (prerequisite)

- Browse freely, no account needed.
- "Sign in" → email → magic link → logged in. No passwords, no IG login.
- Logged-in menu: Saved, Account, Claims, Sign out.

### Discovering the claim

- On any artist/shop page: **"Is this you? Claim this listing"**, near the name.
- Visible only to logged-in users; logged-out click → sign in → return to listing.
- Already claimed → button hidden, **"Verified owner"** badge shown.

### Starting a claim

- Click → small modal (not a full page): listing name, IG handle, what claiming
  unlocks, one **"Start verification"** button.
- Can't start a second claim on the same listing.

### Proving ownership

- Panel shows a unique **code** (e.g. `TRAD-7F3K`) + one instruction:
  "DM this code to **@yourdirectory** on Instagram, from the account you're
  claiming."
- **"Open Instagram DM"** deep link (prefills where possible).
- Note: "We'll confirm and approve within ~a day." Code shows expiry (~24h) +
  **"Regenerate code."**

### Waiting → outcome

- Listing + Claims menu show **"Pending review"**; user can cancel.
- **Approved** → email "You now manage [listing]"; **Verified owner** badge;
  owner capabilities unlock.
- **Rejected** → email + reason + retry path.

### Account sections

- **Saved** — saved artists + shops.
- **Claims** — status (pending / verified / rejected).
- **Account** — email, name, sign out, "Listings you manage."

### Admin side (one-tap)

- New claim → **push** (email/Slack): user email, listing, claimed handle as
  clickable IG link, the code issued.
- **Claims tab** in `AdminAllData`: rows = user, listing, handle link, evidence
  (did the DM arrive?), **Approve / Reject**.
- Approve → write ownership record, email user, badge live. Reject → optional
  reason, email user.

---

## Phases

### Phase 0 — Experience prototype (THIS phase, mock only)

- [ ] `claims` tab in `AdminAllData` with fixture rows + switchable states.
- [ ] Admin claim row: user, listing, handle link, evidence, Approve/Reject
      (buttons no-op / local state only).
- [ ] User-facing mock: "Claim this listing" button + verification modal
      (code display, DM deep-link, expiry, regenerate) — fixture-driven.
- [ ] Mock Claims section in the account menu (pending/verified/rejected).
- [ ] Theme-verify all mock states across every variant.
- [ ] Smoke test: click through every state; confirm the flow feels right.
- **Exit:** the experience is locked; no data touched.

### Phase 1 — Wire up dormant auth (make accounts real)

- [ ] Mount `/login`, `/account`, `/saved`, `/auth/callback` in `App.tsx`.
- [ ] Confirm `AuthCallback` handler exists and token exchange works.
- [ ] Header entry point (Sign in / Account).
- [ ] Add redirect URLs to Supabase allowlist; verify magic link end-to-end
      against **live** Supabase (not just a build).

### Phase 2 — Shop favorites (schema symmetry)

- [ ] Migration: `saved_shops` mirroring `saved_artists` (FK → `tattoo_shops`,
      RLS, indexes, `UNIQUE(user_id, shop_id)`).
- [ ] `useSavedShops` hook mirroring `useSavedArtists`.
- [ ] Save buttons on `ShopPage` + shop cards.
- [ ] `SavedPage`: artists + shops sections.

### Phase 3 — Claim backend (wire the mock)

- [ ] Migration: `claim_requests` + `listing_owners` join, RLS, indexes.
- [ ] API: create claim, cancel claim, list own claims, admin list/approve/reject.
- [ ] Notification on new claim (Vercel/Supabase fn + Resend/Slack).
- [ ] Wire the Phase-0 mock components to real data.
- [ ] Verified-owner badge on public listings.
- **Note:** honor the api-sync rule if any client/handler contract spans repos.

### Phase 4 — Owner capabilities (scope TBD, see decisions)

- [ ] Minimum: badge + "listings you manage."
- [ ] Optional: self-edit of owned listing (direct vs. review-queued — decide).

### Phase 5 (optional, later) — auto-approve layer

- [ ] Background job fetches claimant IG bio for the code (Apify/RapidAPI),
      auto-flips clean matches, leaves ambiguous ones in the human queue.
      Brittle/ToS-gray; additive on the same table.

---

## Open product decisions

1. **Owner capabilities:** badge-only vs. self-edit of the listing?
2. **Verified-owner edits:** go live directly, or still route through the
   review queue?
3. **Favorites schema (Phase 2):** parallel `saved_shops` table (recommended,
   keeps FK integrity + mirrors working pattern) vs. polymorphic `favorites`.

## Edge cases to handle (Phase 3+)

- Two people claim the same listing → first verified wins; others auto-rejected.
- Listing has no IG handle on file → manual fallback.
- User changes IG handle later → ownership persists; re-verify only if disputed.
- Claiming an artist **and** their shop → separate claims, same flow.
