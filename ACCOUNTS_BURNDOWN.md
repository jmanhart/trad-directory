# Accounts (Auth + Saved) — Hardening Burndown

Goal: get magic-link auth + save-favorites production-hard, then flip
`VITE_FEATURE_ACCOUNTS=true` in prod. Target launch **alongside Map V1**.

Companion docs: `AUTH_SETUP.md` (environments + rollout mechanics),
`CLAIM_FLOW_PLAN.md` (claims feature, a separate track).

## Launch coupling — the stance

**Decouple technically, target together.** Accounts and Map V1 sit on
independent flags, so don't create a hard dependency:

- Land Map V1 on its own schedule.
- Flip accounts when the P0 gate below is genuinely met — not "when the map
  ships."
- If both are ready the same day, launch together (good story). If not, ship
  the map and flip accounts a few days later. No rework either way.

Rationale: auth's critical path is **email deliverability**, which depends on
DNS/domain verification you don't fully control. Don't let that block the map.

## Critical path — start NOW (longest external lead time)

- [ ] **Pick + configure an SMTP provider** (Resend/SendGrid) on the cloud
      Supabase project (Auth → SMTP Settings).
- [ ] **Verify sender domain: SPF + DKIM + DMARC** DNS records. Propagation +
      warmup take time; a passwordless-only app is dead if links hit spam.
- [ ] Send a real magic link to Gmail/Outlook/iCloud and confirm inbox (not
      spam) placement.

## Already done (context)

- [x] `saved_shops` migration pushed to remote (shop saves work on dev).
- [x] Save hooks log insert/delete failures instead of swallowing them
      (`useSavedArtists.ts`, `useSavedShops.ts`).
- [x] `AUTH_SETUP.md` rewritten with environment matrix + rollout checklist.

## P0 — blockers before flipping the prod flag

- [ ] **Callback resilience** (`src/components/auth/AuthCallback.tsx`). The one
      real bug. Today an expired/consumed/invalid link hangs on "Completing
      sign in…" forever.
      - Parse the URL **hash fragment** for `error` / `error_description`
        (Supabase puts magic-link failures there, not in `?error`).
      - Add a **timeout fallback** (~10s, no session → "This link expired or was
        already used. Request a new one." + button to `/login`).
      - Consider explicit `exchangeCodeForSession` for PKCE robustness.
      - _Done when:_ a stale/expired link lands on a clear error state, never an
        infinite spinner.
- [ ] **Cloud auth URL config** (dashboard). Site URL
      `https://www.trad-directory.com`; redirect allowlist adds
      `https://www.trad-directory.com/**`. Paste `supabase/templates/magic_link.html`
      + subject into Auth → Email Templates.
- [ ] **Login error mapping** (`src/components/auth/LoginPage.tsx`). Replace raw
      `error.message` with friendly copy for the real cases (rate-limit,
      invalid email). Add a **resend cooldown** so users can't spam themselves
      into a lockout.
- [ ] **DB migrations on prod verified** — `supabase migration list` shows every
      local applied to remote (profiles, saved_artists, saved_shops,
      handle_new_user). Re-run `npm run db:push:safe` if any drift.

## P1 — robustness

- [ ] **Save-failure feedback** (`src/components/common/SaveButton.tsx` + save
      hooks). On `toggleSave === false`, show a toast/inline error and revert —
      not the current silent flash. Console log stays as the diagnostic.
- [ ] **Abuse control** — enable **hCaptcha/Turnstile** on `/login`
      (`challenges.cloudflare.com` is already CSP-allowed in `index.html`) to
      stop magic-link email spam.
- [ ] **Account lifecycle** (`src/components/pages/AccountPage.tsx`) —
      **delete-account** (needs an edge function / admin API; `saved_*` already
      cascade via FK) and **sign-out-everywhere**.
- [ ] **Consistent loading states** — replace bare "Loading…" /
      "Completing sign in…" text (`RequireAuth.tsx`, `AuthCallback.tsx`) with
      the app's spinner/skeleton.

## P2 — design & polish

- [ ] **Cross-theme QA (Walter)** — every auth surface (login, callback,
      account, saved, save buttons) across **all themes**, not just default.
      `AuthCallback`/`RequireAuth` use inline `var(--color-*)` styles — verify
      dark + variants. Chase pixel regressions to root cause.
- [ ] **Email dark-mode + client render tests** — template forces light only
      (`magic_link.html:6-7`); test across major clients.
- [ ] **Copy pass (Paula)** — match Trad Directory voice, kill the `✅` emoji
      (`LoginPage.tsx:59`), tighten success/error strings.

## Separate track — Claims (post-P0, not "hardening")

Depends on auth being solid; sequence after the P0 gate. This is a feature
build, not hardening — see `CLAIM_FLOW_PLAN.md` Phase 3.

- [ ] Wire `MOCK_ACCOUNT_CLAIMS` → real `claim_requests` query (a `useClaims`
      hook). Account page claims (`AccountPage.tsx:207-244`) render mock data
      today.
- [ ] Claim submission flow + `/admin/claims` review wiring.

## Optional — test insurance

- [ ] Two Playwright smoke tests: sign-in happy path, expired-link path. Cheap
      coverage for a passwordless-only system. Not required by repo norms; judgment call.

## Definition of done (the launch gate)

Flip `VITE_FEATURE_ACCOUNTS=true` in Vercel production only when **all** hold:

1. Real magic link delivered to a fresh Gmail/Outlook/iCloud inbox (not spam).
2. Expired/invalid link shows a clear recovery state — never an infinite spinner.
3. Save an artist and a shop in prod → both persist and appear on `/saved`
   after reload.
4. Sign-out works; a signed-out user hitting `/saved` is redirected to `/login`.
5. Auth surfaces verified across every theme (Walter signed off).
6. All migrations confirmed on remote.
