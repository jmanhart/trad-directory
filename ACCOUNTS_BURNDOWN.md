# V1 Launch Burndown — Map + Auth/Saved + Claims

Decision (locked): **map, auth+saved, and claims all land together on one big
V1 push.** Single coordinated launch, not staggered flags.

Companion docs: `AUTH_SETUP.md` (auth environments + rollout mechanics),
`CLAIM_FLOW_PLAN.md` (full claim spec + phases).

## Coupling stance & what it implies

All three ship together behind one launch moment. Consequence to plan around,
not to fight:

- **The launch is paced by the slowest leg, which is claims** — Phase 0 mock UI
  is built, but the entire **Phase 3 backend is unbuilt** (no `claim_requests` /
  `listing_owners` tables, no API, no notification). That's the biggest chunk of
  net-new work in V1. Auth hardening is small by comparison; the map is on its
  own branch.
- **Start SMTP/domain verification NOW regardless** — it has the longest
  *external* latency (DNS propagation) and gates every magic-link email,
  including claim approve/reject notifications. It can run in parallel with all
  code work.
- No feature is "done" for V1 until it's verified live in prod (a green build is
  not proof).

## Current state

Done:
- [x] Phase 0 claims mock UI — `ClaimModal`, `ClaimListing`, `AdminClaims`,
      `claims.fixtures.ts`, `/admin/claims` tab.
- [x] Phase 1 auth wiring — `/login`, `/account`, `/saved`, `/auth/callback`
      mounted; header entry points; `AuthCallback` exists.
- [x] Phase 2 shop favorites — `saved_shops` table (pushed to remote),
      `useSavedShops`, save buttons, `SavedPage` artist+shop sections.
- [x] Save hooks log failures instead of swallowing them.
- [x] `AUTH_SETUP.md` rewritten (env matrix + rollout checklist).

Not done: auth hardening (P0/P1/P2 below), claims backend (Phase 3 below),
map V1 (tracked on its own branch).

## Critical path — start NOW (longest external lead time)

- [ ] Pick + configure **SMTP** (Resend/SendGrid) on the cloud Supabase project.
- [ ] Verify sender domain: **SPF + DKIM + DMARC** DNS records.
- [ ] Real magic link → fresh Gmail/Outlook/iCloud inbox, confirm **not spam**.

---

## Track A — Auth hardening (small, mostly code)

### P0 — blockers before prod flag flip
- [ ] **Callback resilience** (`src/components/auth/AuthCallback.tsx`) — the one
      real bug. Expired/consumed/invalid link hangs on "Completing sign in…"
      forever. Parse the URL **hash fragment** for `error`/`error_description`;
      add a **~10s timeout fallback** → clear "link expired, request a new one"
      + button to `/login`. Consider `exchangeCodeForSession` for PKCE.
- [ ] **Cloud auth URL config** (dashboard) — Site URL
      `https://www.trad-directory.com`; redirect allowlist
      `https://www.trad-directory.com/**`; paste `magic_link.html` + subject.
- [ ] **Login error mapping** (`src/components/auth/LoginPage.tsx`) — friendly
      copy for rate-limit / invalid email instead of raw `error.message`; add a
      **resend cooldown**.
- [ ] **DB migrations verified on prod** — `supabase migration list` all applied.

### P1 — robustness
- [ ] **Save-failure feedback** (`SaveButton.tsx` + save hooks) — toast/inline
      error + revert on `toggleSave === false`, not the silent flash.
- [ ] **Abuse control** — hCaptcha/Turnstile on `/login`
      (`challenges.cloudflare.com` already CSP-allowed).
- [ ] **Account lifecycle** (`AccountPage.tsx`) — delete-account (edge fn /
      admin API) + sign-out-everywhere.
- [ ] **Consistent loading states** — replace bare "Loading…" /
      "Completing sign in…" with the app spinner/skeleton.

### P2 — design & polish
- [ ] **Cross-theme QA (Walter)** — every auth surface across all themes;
      `AuthCallback`/`RequireAuth` use inline `var(--color-*)` styles.
- [ ] **Email dark-mode + client render tests** — template is light-only.
- [ ] **Copy pass (Paula)** — Trad Directory voice, kill `✅` emoji, tighten
      strings.

---

## Track B — Claims backend (the big one, Phase 3)

The pacing leg of V1. Phase 0 mock UI is done; this wires it to real data.
See `CLAIM_FLOW_PLAN.md` Phase 3 for full spec.

- [ ] **Migration** — `claim_requests` (user_id, entity_type, entity_id,
      claimed_handle_snapshot, status, code, expires_at, timestamps) +
      `listing_owners` join (entity_type, entity_id, user_id, verified_at),
      RLS, indexes. Rehearse locally per `trad-directory-db-changes` skill.
- [ ] **API** — create claim, cancel claim, list own claims, admin
      list/approve/reject. **Cross-repo:** honor `check-api-sync.js` if any
      contract spans `td-chrome-ext`.
- [ ] **Notification on new claim** — Vercel/Supabase fn → Resend/Slack to John
      (uses the same SMTP/deliverability as magic link).
- [ ] **Wire Phase-0 mock → real data** — `AccountPage` claims
      (`MOCK_ACCOUNT_CLAIMS` → `useClaims`), `ClaimModal`, `AdminClaims`
      approve/reject.
- [ ] **Verified-owner badge** on public artist/shop listings; hide claim button
      when already owned.
- [ ] **Edge cases** — duplicate claims (first verified wins), no IG handle on
      file, handle-change persistence (per plan).

---

## Track C — Map V1

Tracked on its own branch (`polish/map`). Not enumerated here; folded into the
launch gate. Confirm it's theme-verified and prod-ready before the coupled flip.

---

## Definition of done — the coupled V1 launch gate

Flip `VITE_FEATURE_ACCOUNTS=true` in prod **and** promote the map only when ALL:

1. Real magic link lands in a fresh Gmail/Outlook/iCloud inbox (not spam).
2. Expired/invalid link shows a clear recovery state — never an infinite spinner.
3. Save an artist + a shop in prod → persist + appear on `/saved` after reload.
4. Sign-out works; signed-out `/saved` → redirect to `/login`.
5. **Claims end-to-end in prod:** submit a claim → John gets the notification →
   approve in `/admin/claims` → verified-owner badge appears + user emailed.
6. All migrations confirmed on remote (accounts + claims tables).
7. Every new surface (auth, saved, claims, map) theme-verified (Walter signed off).
