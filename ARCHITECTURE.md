# Architecture

> How Trad Directory is built, how the pieces connect, and where to find things.

## System Overview

Trad Directory is a web app for discovering traditional tattoo artists and shops worldwide. Users can search, browse by location, explore an interactive map, and suggest new artists. Admins manage data through a built-in dashboard.

```
┌─────────────────────────────────────────────────────┐
│                     Vercel                          │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │  React SPA   │  │  Serverless Functions (/api)│  │
│  │  (Vite)      │──│  30 endpoints               │  │
│  │  Port 5173   │  │  Port 3001 (dev)            │  │
│  └──────────────┘  └─────────────┬──────────────┘  │
│                                  │                  │
│  ┌──────────────┐  ┌─────────────▼──────────────┐  │
│  │  Cron Jobs   │  │                             │  │
│  │  • IG Checker│──│     Supabase (PostgreSQL)   │  │
│  │  • Backup    │  │     + Row Level Security    │  │
│  └──────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │                    │
    ┌────▼────┐        ┌──────▼──────┐
    │ Sentry  │        │   GitHub    │
    │ Errors  │        │   Backups   │
    │ Replays │        │   (weekly)  │
    └─────────┘        └─────────────┘
```

**Tech stack:** React 18 · TypeScript (strict) · Vite · Supabase · Vercel · Sentry

---

## Project Structure

```
trad-directory/
├── api/                        # Vercel serverless functions (30 endpoints)
│   ├── _middleware/auth.ts      # Admin auth middleware
│   ├── _utils/                  # Shared API utilities
│   ├── artists/[id].ts          # Dynamic route: single artist
│   ├── addArtist.ts             # Admin: create artist
│   ├── updateArtist.ts          # Admin: edit artist
│   ├── listArtists.ts           # Public: artist list
│   ├── searchArtists.ts         # Public: search
│   ├── mapData.ts               # Public: map coordinates + counts
│   ├── checkInstagramLinks.ts   # Cron: link checker
│   ├── backup.ts                # Cron: weekly database backup
│   └── ...
├── src/
│   ├── components/
│   │   ├── pages/               # Route-level components
│   │   │   ├── admin/           # Admin dashboard (8 pages + hooks)
│   │   │   ├── ArtistPageV2/    # Artist detail page
│   │   │   ├── MapPage.tsx      # World map
│   │   │   └── ...
│   │   ├── auth/                # Login, AuthCallback, RequireAuth
│   │   ├── common/              # TopAppBar, Footer, SearchBar, Toast, TypeNumber
│   │   ├── artist/              # ArtistCard, ArtistRow
│   │   ├── shop/                # ShopCard, ShopRow
│   │   ├── map/                 # MapView, MapDetailPanel, MapTooltip
│   │   └── search/              # Search UI components
│   ├── contexts/AuthContext.tsx  # Auth state (Supabase session)
│   ├── hooks/                   # useHomePageData, useSearchSuggestions, etc.
│   ├── services/
│   │   ├── api.ts               # Public data fetching (~960 lines)
│   │   └── adminApi.ts          # Admin operations (~590 lines)
│   ├── types/entities.ts        # Core TypeScript interfaces
│   ├── utils/                   # Slug generation, analytics, Sentry helpers
│   └── styles/variables.css     # Design tokens
├── public/TYPE/                 # Custom SVG digit assets (0-9, red + default)
├── migrations/                  # SQL migration files (applied manually)
├── scripts/
│   ├── backup.cjs               # Local backup script
│   └── restore.cjs              # Database restore script
├── vercel.json                  # Deployment + cron config
└── CLAUDE.md                    # AI assistant instructions
```

---

## Database

### Schema

Supabase PostgreSQL with Row Level Security. The database is small (~14 MB, ~3,400 rows) — the entire dataset fits in memory.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  countries   │◄────│    states    │◄────│    cities    │
│  id          │     │  id          │     │  id          │
│  country_name│     │  state_name  │     │  city_name   │
│  continent   │     │  country_id  │     │  state_id    │
│              │     │              │     │  country_id  │
│  34 rows     │     │  72 rows     │     │  latitude    │
└──────────────┘     └──────────────┘     │  longitude   │
                                          │  263 rows    │
                                          └──────┬───────┘
                                                 │
                     ┌───────────────────────────┐│
                     │                           ││
              ┌──────▼───────┐            ┌──────▼───────┐
              │ tattoo_shops │            │   artists    │
              │ id           │            │ id           │
              │ shop_name    │            │ name         │
              │ slug         │            │ slug         │
              │ instagram    │            │ instagram    │
              │ city_id      │            │ city_id      │
              │ 228 rows     │            │ is_traveling │
              └──────┬───────┘            │ 1003 rows   │
                     │                    └──────┬───────┘
                     │                           │
                     │    ┌──────────────────┐   │
                     └────│ artist_location  │───┘
                          │ artist_id        │
                          │ city_id          │
                          │ shop_id          │
                          │ is_primary       │
                          │ 1001 rows        │
                          └──────────────────┘
```

**Other tables:**
- `artist_shop` — legacy junction table (artist ↔ shop)
- `submissions` — public suggestions for new artists
- `profiles` / `saved_artists` — user favorites (Supabase auth)
- `link_check_results` / `link_check_cursor` — Instagram checker state

### Key Relationships

- **Artists → Cities**: `city_id` foreign key for primary location
- **Artists → Locations**: `artist_location` many-to-many (supports multiple cities per artist)
- **Artists → Shops**: Through `artist_location.shop_id` or legacy `artist_shop`
- **Cities → States → Countries**: Hierarchical location chain
- **Stateless cities**: Some non-US cities skip states and use `country_id` directly

### Row Level Security

Public tables (anon SELECT, service-role write): `artists`, `tattoo_shops`, `cities`, `states`, `countries`, `artist_location`

User tables (auth-scoped): `profiles`, `saved_artists`

Service-role only: `link_check_results`, `link_check_cursor`

Public INSERT only: `submissions`

### Migrations

SQL files in `/migrations/`, applied manually via the Supabase SQL Editor. Not versioned with a migration tool — the file names serve as the changelog.

---

## API Layer

All endpoints live in `/api/` as Vercel serverless functions. They use the Supabase service role key for elevated access (bypasses RLS).

### Public Endpoints (GET, CORS enabled)

| Endpoint | Purpose |
|---|---|
| `listArtists` | All artists with Instagram handles |
| `listAllArtists` | Artists with full city/state/country data |
| `listShops` / `listAllShops` | Shop listings |
| `listCities` / `listCountries` / `listStates` | Location data |
| `searchArtists` | Full-text search across name, handle, location |
| `mapData` | City coordinates with artist/shop counts |
| `artists/[id]` | Single artist by ID or slug |
| `submitReport` | Public submission form |

### Admin Endpoints (POST, Bearer auth)

Protected by `_middleware/auth.ts` which checks `Authorization: Bearer ${ADMIN_API_KEY}`.

| Endpoint | Purpose |
|---|---|
| `addArtist` | Create artist + auto-create city/state/country + dual-write to `artist_location` |
| `updateArtist` / `updateShop` / `updateCity` / `updateCountry` | Edit records |
| `addArtistLocation` / `deleteArtistLocation` | Manage artist ↔ city links |
| `addArtistShopLink` | Link artist to shop |
| `listSubmissions` / `updateSubmission` | Manage public suggestions |
| `listBrokenLinks` | Broken Instagram link report |
| `addShop` / `updateShop` | Create/edit shop; geocodes the street address → `latitude`/`longitude` on save |
| `geocodeAddress` | Preview-geocode an address (powers the admin "Check address" tool) |

### Cron Endpoints (GET, CRON_SECRET auth)

| Endpoint | Schedule | Purpose |
|---|---|---|
| `checkInstagramLinks` | Every 15 min, 2–6 AM UTC | Batch-checks 50 Instagram profiles per run |
| `backup` | Sundays, 7 AM UTC | Exports all tables to GitHub backup repo |

### Services Layer

The frontend never calls `/api/` directly — it goes through two service modules:

- **`src/services/api.ts`** — Public data fetching. Search, artist/shop/city/country queries, URL helpers.
- **`src/services/adminApi.ts`** — Admin CRUD. All requests include `Authorization: Bearer ${VITE_ADMIN_PASSWORD}`.

---

## Frontend

### Routing

React Router v6. All routes are defined in `App.tsx`.

**Public:**
| Route | Page |
|---|---|
| `/` | Homepage (stats, search, recent artists) |
| `/artists` | All artists (filterable list) |
| `/shops` | All shops |
| `/countries` | All countries |
| `/artist/:slugOrId` | Artist detail |
| `/shop/:slugOrId` | Shop detail |
| `/search-results?q=` | Search results |
| `/map` | Interactive world map |
| `/united-states` | US-specific map |
| `/about` | About page |

**Admin (password-gated via `ProtectedRoute`):**
| Route | Page |
|---|---|
| `/admin/all-data` | Master data table with inline editing |
| `/admin/add-artist` | Add artist form |
| `/admin/add-shop` | Add shop form |
| `/admin/new-adding` | Consolidated add workflow |
| `/admin/broken-links` | Broken Instagram links |

### Map

Built with `react-simple-maps` using TopoJSON data from CDN (world-atlas, us-atlas).

**How it works:**
1. `MapView` fetches `/api/mapData` on mount → gets cities with lat/lng and artist/shop counts
2. Four zoom tiers: Continent (1.8x) → Country (3.5x) → State → City (6x)
3. Cities cluster into continent/country/state groups based on zoom level
4. Clicking a marker opens `MapDetailPanel` with artists at that location

### Key Hooks

| Hook | Purpose |
|---|---|
| `useHomePageData` | Fetches top cities, countries, suggestions for homepage |
| `useSearchSuggestions` | Autocomplete for search bar |
| `useSavedArtists` | User's favorited artists (Supabase-backed) |
| `useListControls` | Filtering/sorting state for list pages |
| `useIsMobile` | Responsive viewport detection |
| `usePageTracking` | Auto page-view tracking on route changes |

---

## Authentication

Two separate auth systems:

### Public Users — Supabase Magic Link
- Passwordless email login via `AuthContext.tsx`
- `signInWithMagicLink(email)` → email with link → `AuthCallback.tsx` handles redirect
- Used for: saving favorite artists
- Supabase RLS enforces per-user access on `saved_artists` and `profiles`

### Admin — Password Gate
- Simple password check against `VITE_ADMIN_PASSWORD` env var
- Client-side: `ProtectedRoute.tsx` shows password form, stores auth in component state (session only)
- Server-side: API endpoints validate `Authorization: Bearer <password>` via `requireAdminAuth()`
- Not role-based — single shared password

---

## Styling

CSS Modules (`.module.css` files) scoped to each component. Design tokens defined as CSS custom properties in `src/styles/variables.css`.

### Design Tokens

**Colors:** Red-forward palette (traditional tattoo aesthetic). Raw colors (`--red-200/300/400`) + semantic tokens (`--color-primary`, `--color-text-primary`).

**Typography:** Inter font family. Sizes from `--font-size-xs` (0.75rem) to `--font-size-3xl` (3.2rem).

**Spacing:** Scale from `--spacing-xxs` (0.125rem) to `--spacing-2xl` (3rem).

**Custom type:** Homepage stats use SVG digit images (`public/TYPE/`) rendered by the `TypeNumber` component — numbers display in a custom typeface with comma formatting.

---

## Cron Jobs

### Instagram Link Checker
- **Schedule:** `*/15 2-6 * * *` (every 15 min, 2–6 AM UTC)
- **How:** Fetches 50 profiles per run from a cursor-tracked queue. Sends HEAD requests to Instagram with 3–5s random delays to avoid rate limiting. Stores results in `link_check_results`.
- **Monitoring:** Sentry check-in (`instagram-link-checker` monitor). Broken links logged as Sentry warnings.
- **Admin view:** `/admin/broken-links`

### Database Backup
- **Schedule:** `0 7 * * 0` (Sundays 7 AM UTC)
- **How:** Exports 10 tables as JSON + generates `restore.sql`. Pushes to a private GitHub repo via Git Trees API in a single atomic commit.
- **Monitoring:** Sentry check-in (`database-backup` monitor).
- **Manual:** `npm run backup` (local) or `npm run backup:push` (local + push to GitHub)
- **Restore:** `npm run restore` (dry-run) or `npm run restore:execute`

---

## External Services

| Service | Purpose | Config |
|---|---|---|
| **Supabase** | PostgreSQL database + auth + RLS | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (server), anon key (client) |
| **Vercel** | Hosting, serverless functions, cron | `vercel.json`, auto-deploys from `main` and `develop` |
| **Sentry** | Error tracking, session replays, cron monitoring | `SENTRY_DSN`, source maps uploaded at build |
| **GitHub** | Backup storage | `BACKUP_GITHUB_TOKEN`, `BACKUP_REPO` |
| **Cloudflare Turnstile** | Captcha on public submission form | `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| **Google Analytics** | Page views, search tracking, click events | Configured in `src/utils/analytics.ts` |
| **Vercel Analytics** | Performance monitoring | `@vercel/analytics` package |

---

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Start frontend + API together
npm run dev:admin

# Frontend only (no API)
npm run dev

# Everything (frontend + API + Storybook)
npm run everything
```

The Vite dev server proxies `/api/*` requests to `localhost:3001` where `vercel dev` runs the serverless functions locally.

### Environment Variables

**Frontend (VITE_ prefix, exposed to browser):**
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PASSWORD`
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_APP_VERSION`

**Server (API endpoints only):**
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`
- `ADMIN_API_KEY` (must match `VITE_ADMIN_PASSWORD`)
- `CRON_SECRET`
- `BACKUP_GITHUB_TOKEN` / `BACKUP_REPO`
- `TURNSTILE_SECRET_KEY`
- `SENTRY_AUTH_TOKEN` (build-time, for source maps)

### Code Conventions

- **Formatting:** Prettier — double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char width
- **Components:** Functional only, PascalCase files
- **Utilities:** camelCase files
- **Imports:** Path alias `@/` → `./src/`
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters`

### Deploying

```bash
npm run deploy           # Production
npm run deploy:preview   # Preview URL
```

Vercel also auto-deploys on push to `main` or `develop`.

---

## Data Flow Examples

### Adding an Artist (Admin)

```
Admin form → adminApi.addArtist() → POST /api/addArtist
  1. Validate admin auth (Bearer token)
  2. Get or create country → state → city (if needed)
  3. Generate unique slug
  4. INSERT into artists table
  5. Link to shop (if provided) → INSERT into artist_shop
  6. Dual-write → INSERT into artist_location
  7. Return { success, artist_id }
```

### Map Page Load

```
MapPage mounts → MapView fetches /api/mapData
  1. Query artist_location joined with cities (lat/lng)
  2. Count artists + shops per city
  3. Return array of { city, lat, lng, artist_count, shop_count }
  4. MapView renders markers on react-simple-maps
  5. Zoom triggers re-clustering (continent → country → state → city)
  6. Click marker → MapDetailPanel shows artists at location
```

### Search

```
User types in SearchBar → useSearchSuggestions debounces
  → GET /api/searchArtists?q=query
  → Case-insensitive search across: name, instagram_handle, city, state, country
  → Returns matched artists with location data
  → SearchResults page displays cards
```
