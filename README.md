# Trad Directory

A directory of traditional ("trad") tattoo artists and the shops they work out of — browse by artist, shop, or location on an interactive map.

**Live:** [www.trad-directory.com](https://www.trad-directory.com) &nbsp;·&nbsp; **Component gallery:** [Storybook](https://trad-directory-storybook-jmanharts-projects.vercel.app)

Built with React + TypeScript + Vite, Supabase for data, and Vercel serverless functions for the admin API.

## Features

- **Interactive map** — artists and shops clustered continent → country → state → city, with drill-down side panels for each location.
- **Search** — unified search across artists, shops, and locations with grouped suggestions.
- **Browse** — artist, shop, and country listings with filters, plus a "recently added" feed.
- **Admin** — password-gated tools for adding and editing directory data.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase keys
npm run dev            # http://localhost:5173
```

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required to boot — everything else in `.env.example` is optional.

To run the admin API (Vercel functions in `/api`) locally alongside the app:

```bash
npm run dev:admin      # app on :5173, `vercel dev` API on :3001
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run dev:admin` | App + local API (`vercel dev`) together |
| `npm run build` | Production build → `dist/` |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run storybook` | Storybook dev server on :6006 |
| `npm run build-storybook` | Static Storybook build → `storybook-static/` |
| `npm run deploy` | Deploy to Vercel production |

## Storybook

A curated component gallery — the search bar, map side panels, brand marks, and shared primitives — rendered with the app's real design tokens and mock data (no database access).

- **Live:** https://trad-directory-storybook-jmanharts-projects.vercel.app
- **Local:** `npm run storybook` → http://localhost:6006

Stories live next to their components (`*.stories.tsx`); shared mock data is in `src/stories/fixtures.ts`. It deploys as its own Vercel project (`build-storybook` → `storybook-static/`), so a component that breaks the gallery shows up as a failed Storybook build on the PR.

## Tech stack

React 18 · TypeScript · Vite 5 · React Router · Supabase · Vercel (hosting + serverless API) · Sentry · Storybook 8. Requires Node 20+.

## Deployment

Pushes to `main` auto-deploy to Vercel. Two projects build from this repo:

- **`trad-directory`** — the app (`npm run build` → `dist/`).
- **`trad-directory-storybook`** — the component gallery (`npm run build-storybook` → `storybook-static/`).
