# CLAUDE.md - Tattoo Artist Directory

## Project Overview

A web application for discovering traditional tattoo artists and shops globally. Users can search, browse by location, and suggest new artists. Admins manage data and monitor broken Instagram links.

**Live on Vercel** | **Supabase PostgreSQL** | **Sentry error tracking**

## Tech Stack

- **Frontend:** React 18 + TypeScript (strict) + Vite + SWC
- **Styling:** CSS Modules + CSS Custom Properties (design tokens in `src/styles/variables.css`)
- **Routing:** React Router DOM 6
- **Backend:** Vercel Serverless Functions (Node.js) in `/api`
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Magic Link (passwordless email)
- **Monitoring:** Sentry (errors + session replays) + Vercel Analytics
- **Component docs:** Storybook 8
- **Node version:** 18 (see `.nvmrc`)

## Key Commands

```bash
npm run dev              # Vite dev server (port 5173)
npm run dev:admin        # Vite + Vercel API server (port 3001) together
npm run everything       # Vite + API + Storybook all at once
npm run build            # Production build to /dist
npm run lint             # ESLint
npm run format           # Prettier auto-format
npm run format:check     # Prettier check only
npm run storybook        # Storybook on port 6006
npm run deploy           # Deploy to Vercel production
npm run deploy:preview   # Deploy Vercel preview
npm run check-links      # Run Instagram link checker
```

## Project Structure

```
api/                     # Vercel serverless functions (~29 endpoints)
src/
  components/
    pages/               # Route-level page components
      admin/             # Admin dashboard pages + hooks
      ArtistPageV2/      # New artist page design
    auth/                # Login, AuthCallback, RequireAuth
    common/              # Shared UI: TopAppBar, Footer, SearchBar, modals, Toast
    artist/              # Artist card/list components
    shop/                # Shop card/list components
    search/              # Search section
    results/             # Search results display
    illustrations/       # SVG illustration components
  contexts/              # React Context (AuthContext)
  hooks/                 # Custom hooks (usePageTracking, useHomePageData)
  lib/                   # Supabase client singleton
  services/              # API service layer (api.ts, adminApi.ts)
  types/                 # TypeScript interfaces (entities.ts)
  utils/                 # Utilities (slug, analytics, sentry, etc.)
  styles/                # Global CSS + design tokens
migrations/              # SQL migration files (10 total)
scripts/                 # Maintenance scripts (link checker, release)
```

## Code Conventions

### Formatting (Prettier)
- Double quotes, semicolons, trailing commas (ES5)
- 2-space indent, 80 char print width
- Arrow parens: avoid (`x => x` not `(x) => x`)
- LF line endings

### TypeScript
- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- Path alias: `@/` maps to `./src/`
- Core types in `src/types/entities.ts`

### React Patterns
- Functional components only
- CSS Modules for component styling (`.module.css` sibling files)
- Context API for global state (no Redux)
- Custom hooks for data fetching and form logic
- PascalCase component files, camelCase utility files

### API Pattern
- Serverless functions in `/api` directory
- Public endpoints: `list*.ts`, `search*.ts` (GET with CORS)
- Admin endpoints: `add*.ts`, `update*.ts` (POST)
- Supabase Service Role Key for server-side elevated access
- Error responses: `{ error: string }` with appropriate status codes

## Database

**Main tables:** artists, tattoo_shops, cities, states, countries, artist_location (many-to-many), submissions, profiles, saved_artists, link_check_results

- Migrations in `/migrations` (manually applied SQL)
- RLS policies on user-facing tables
- Slugs for SEO-friendly URLs with ID fallback

## Authentication

- **Public users:** Supabase Magic Link (email-based, passwordless)
- **Admin:** Simple password gate via `VITE_ADMIN_PASSWORD` env var
- Auth state managed in `src/contexts/AuthContext.tsx`
- Protected routes via `src/components/common/ProtectedRoute.tsx`

## Environment Variables

### Frontend (VITE_ prefix, exposed to client)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` - Supabase connection
- `VITE_ADMIN_PASSWORD` - Admin access password
- `VITE_APP_VERSION` - App version string
- `VITE_TURNSTILE_SITE_KEY` - Cloudflare Turnstile captcha

### Backend (server-side only)
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` - Supabase service role
- `REDIS_URL` - Redis cache (optional)
- `CRON_SECRET` - Cron job auth
- `SENTRY_AUTH_TOKEN` - Sentry source maps

## Cron Jobs

- **Instagram link checker:** Runs every 15 min, 2-6 AM UTC (configured in `vercel.json`)
- Checks batches of 50 profiles, stores results in `link_check_results`
- Admin view at `/admin/broken-links`

## Important Notes

- No unit test suite yet - Storybook is used for component documentation/visual testing
- Redis cache is optional and falls back gracefully
- The project uses Vite's proxy to forward `/api` calls to localhost:3001 during dev
- SVGs can be imported as React components (via vite-plugin-svgr)
