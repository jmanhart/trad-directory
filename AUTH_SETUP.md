# Magic Link Authentication Setup

Accounts (magic-link sign-in, save-favorites, claim-your-listing) are built
behind the `accounts` feature flag. **Working in local + dev preview; dark in
production** until the rollout checklist below is done.

- Flag: `VITE_FEATURE_ACCOUNTS` (build-time, `src/lib/flags.ts`). Unset →
  Vite dead-code-eliminates every account route, nav link, and save button, so
  nothing ships. This is why production currently has no Saved page.
- Auth: Supabase GoTrue magic link (`signInWithOtp`), no passwords.
- Favorites: per-user rows in `saved_artists` / `saved_shops`, RLS-scoped to the
  owner; the browser writes them directly (not through `/api`).

## File Tree

```
src/
├── lib/
│   ├── supabaseClient.ts          # Supabase client singleton (VITE_SUPABASE_*)
│   └── flags.ts                   # accounts feature flag
├── contexts/
│   └── AuthContext.tsx            # AuthProvider (mounted in main.tsx)
├── hooks/
│   ├── useSavedArtists.ts         # saved_artists read/toggle
│   └── useSavedShops.ts           # saved_shops read/toggle
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx          # magic link login form
│   │   ├── RequireAuth.tsx        # protected route wrapper
│   │   └── AuthCallback.tsx       # token exchange on redirect
│   └── pages/
│       ├── SavedPage.tsx          # saved artists + shops
│       └── AccountPage.tsx
supabase/
├── migrations/                    # source of truth (profiles, saved_artists,
│                                  #   saved_shops, handle_new_user trigger)
├── templates/magic_link.html      # branded magic-link email
└── config.toml                    # LOCAL auth config only (not cloud)
```

## Environments

Three environments, three different backends. The `23503` FK error we hit came
from mixing them — see Gotchas.

| | Backend Supabase | `VITE_FEATURE_ACCOUNTS` | Magic-link email |
|---|---|---|---|
| **Local** | local stack (`127.0.0.1:54321`) | on (via `.env.local`) | mail catcher `:54324`, any fake address |
| **Dev preview** (Vercel) | cloud project | on (preview env var) | cloud SMTP — real emails |
| **Production** (`trad-directory.com`) | cloud project | **off until launch** | cloud SMTP — real emails |

`config.toml` `[auth]` (`site_url`, `additional_redirect_urls`, `magic_link`
template) governs **local only**. The cloud project's equivalent settings live
in the Supabase dashboard and must be set separately (rollout step 2–3).

## Local Development

Full detail in the `trad-directory-local-auth-testing` skill. Short version:

1. `colima start` (Docker via Colima, not Docker Desktop).
2. `npm run db:start` — starts local Supabase; auto-runs migrations + `seed.sql`.
   Ports: API 54321, Studio 54323, **mail catcher 54324**.
3. `.env.development.local` (gitignored) points the browser at local Supabase.
   If parked as `.bak`, restore it (or recreate from `supabase status`).
4. `npm run dev:admin` — `.env.local` already sets `VITE_FEATURE_ACCOUNTS=true`.
   Env is not hot-reloaded; restart after any env change.
5. Sign in: `/login` → any fake email → open **http://127.0.0.1:54324** → click
   the magic link. `handle_new_user` auto-creates a `profiles` row.

## Production Rollout Checklist

Do these in order against the **cloud** project before flipping the flag.

1. **Database.** Apply all migrations to the cloud project:
   ```bash
   npm run db:push:safe          # backs up, then supabase db push
   supabase migration list       # confirm every local has a matching remote
   ```
   This provisions `profiles`, `saved_artists`, `saved_shops`, and the
   `handle_new_user` trigger with their RLS policies.

2. **Auth URL configuration** (Dashboard → Authentication → URL Configuration —
   the cloud equivalent of `config.toml`, which is local-only):
   - Site URL: `https://www.trad-directory.com`
   - Redirect URLs: add `https://www.trad-directory.com/**` (covers
     `/auth/callback`). Match protocol + host exactly.

3. **Email delivery** (Dashboard → Authentication):
   - **SMTP Settings**: configure a real provider (SendGrid/Resend/etc.). The
     built-in sender is rate-limited (~2–4/hr, `config.toml` shows
     `email_sent = 2` locally) and is for testing only — without SMTP,
     production magic links will throttle and drop.
   - **Email Templates → Magic Link**: paste the HTML from
     `supabase/templates/magic_link.html`; set subject
     `Your Trad Directory sign-in link`.
   - Ensure email signups are enabled (`enable_signup`).

4. **Feature flag** (the launch switch). In Vercel **Production** env, set:
   ```
   VITE_FEATURE_ACCOUNTS=true
   ```
   Build-time, so this triggers a redeploy. Also surfaces `/admin/claims`.
   Leave unset to keep accounts dark.

5. **Redeploy + verify live** (a passing build is not proof):
   - `/login` on the production domain → magic link arrives via SMTP.
   - Click it → lands signed in → save an artist and a shop → both persist and
     appear on `/saved` after reload.

## How It Works

1. Protected route (`RequireAuth`) → redirect to `/login`.
2. Email entered → `signInWithOtp` sends the magic link.
3. Link → `/auth/callback` → Supabase token exchange → authenticated.
4. `AuthCallback` redirects to the original destination (or `/saved`).

## Usage

Protected route:

```tsx
<Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
```

Auth in a component:

```tsx
import { useAuth } from "../contexts/AuthContext";
const { user, signOut } = useAuth();
```

Saving (through the hooks, which own persistence + optimistic state):

```tsx
import { useSavedArtists } from "../hooks/useSavedArtists";
const { isSaved, toggleSave } = useSavedArtists();
// toggleSave(artistId) inserts/deletes the saved_artists row; logs on failure.
```

## Gotchas

- **`23503` FK violation on save (`Key is not present in table "users"`).**
  You're signed in with a session minted against one Supabase but the browser
  client points at another (classic: a cloud session in localStorage while
  `.env.development.local` points at local). RLS passes (`auth.uid() ==
  user_id`) but the FK to that backend's `auth.users` has no row. Fix: sign out
  and sign in fresh against the backend you're actually pointed at. A session
  and DB must agree on who you are.
- **Redirect URL must match exactly** — protocol, host, and port. For local use
  `http://localhost:5173`, not `127.0.0.1`.
- **`config.toml` changes need `supabase stop && supabase start`**; cloud auth
  changes are made in the dashboard, not this file.
- **Env changes are not hot-reloaded** — full dev-server restart.
