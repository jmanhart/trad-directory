# Trad Directory

[![version](https://img.shields.io/github/package-json/v/jmanhart/trad-directory?label=version&color=c0392b)](./CHANGELOG.md)
[![release](https://img.shields.io/github/v/release/jmanhart/trad-directory?color=c0392b&sort=semver)](https://github.com/jmanhart/trad-directory/releases)
[![live](https://img.shields.io/website?url=https%3A%2F%2Fwww.trad-directory.com&label=site&up_message=live&up_color=c0392b&down_message=down)](https://www.trad-directory.com)
[![last commit](https://img.shields.io/github/last-commit/jmanhart/trad-directory?color=c0392b)](https://github.com/jmanhart/trad-directory/commits/main)

A directory of traditional ("trad") tattoo artists and the shops they work out of — browse by artist, shop, or location on an interactive map.

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?logo=sentry&logoColor=white)

**Live:** [www.trad-directory.com](https://www.trad-directory.com) &nbsp;·&nbsp; **Components:** [Storybook](https://trad-directory-storybook-jmanharts-projects.vercel.app) &nbsp;·&nbsp; **Changes:** [CHANGELOG](./CHANGELOG.md)

Built with React + TypeScript + Vite, Supabase for data, and Vercel serverless functions for the admin API.

## Features

- **Interactive map** — artists and shops clustered continent → country → state → city, with drill-down side panels for each location.
- **Search** — unified search across artists, shops, and locations with grouped suggestions.
- **Browse** — artist, shop, and country listings with filters, plus a "recently added" feed.
- **Admin** — password-gated tools for adding and editing directory data, plus a Link Health view that probes Instagram handles and flags dead links.

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

| Command                           | What it does                                 |
| --------------------------------- | -------------------------------------------- |
| `npm run dev`                     | Vite dev server                              |
| `npm run dev:admin`               | App + local API (`vercel dev`) together      |
| `npm run build`                   | Production build → `dist/`                   |
| `npm run lint` / `npm run format` | ESLint / Prettier                            |
| `npm run storybook`               | Storybook dev server on :6006                |
| `npm run build-storybook`         | Static Storybook build → `storybook-static/` |
| `npm run deploy`                  | Deploy to Vercel production                  |

## Storybook

A curated component gallery — the search bar, map side panels, brand marks, and shared primitives — rendered with the app's real design tokens and mock data (no database access).

- **Live:** https://trad-directory-storybook-jmanharts-projects.vercel.app
- **Local:** `npm run storybook` → http://localhost:6006

Stories live next to their components (`*.stories.tsx`); shared mock data is in `src/stories/fixtures.ts`. It deploys as its own Vercel project (`build-storybook` → `storybook-static/`), so a component that breaks the gallery shows up as a failed Storybook build on the PR.

## Versioning & releases

Semantic Versioning with an automated, PR-gated flow:

- **Patch** (`0.3.x`) — fixes & internal work · **Minor** (`0.x.0`) — new features · **Major** (`1.0.0`) — the public launch (the map going GA).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:` → patch, `feat:` → minor). On every push to `main`, [release-please](https://github.com/googleapis/release-please) maintains a **Release PR** that bumps `package.json` and updates the [changelog](./CHANGELOG.md); merging it tags `vX.Y.Z` and cuts the GitHub release.
- The **version** badge above tracks `package.json`; the **release** badge tracks the latest tag — both move on their own as releases ship.

Full policy in [RELEASE.md](./RELEASE.md).

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design & data model
- [AUTH_SETUP.md](./AUTH_SETUP.md) — admin authentication
- [RELEASE.md](./RELEASE.md) — versioning & release workflow
- [CHANGELOG.md](./CHANGELOG.md) — release history

## Tech stack

React 18 · TypeScript · Vite 5 · React Router · Supabase · Vercel (hosting + serverless API) · Sentry · Storybook 8. Requires Node 20+.

## Deployment

Pushes to `main` auto-deploy to Vercel. Two projects build from this repo:

- **`trad-directory`** — the app (`npm run build` → `dist/`).
- **`trad-directory-storybook`** — the component gallery (`npm run build-storybook` → `storybook-static/`).
