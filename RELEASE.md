# Release & Versioning

This project uses [Semantic Versioning](https://semver.org/) and, going
forward, [Conventional Commits](https://www.conventionalcommits.org/) to drive
an automated changelog and release flow. Every release is tracked in
[CHANGELOG.md](./CHANGELOG.md) and mirrored as a release in Sentry so errors and
performance data tie back to a specific version.

## Version policy

Versions are `MAJOR.MINOR.PATCH`. We are **pre-1.0** (currently `0.2.0`), so:

| Bump              | When                                                                                   | Examples                                                                           |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **PATCH** `0.2.x` | Bug fixes, copy, styling, performance, instrumentation — no new user-facing capability | the Sentry observability work; the 400-serializer probe fix; table/ellipsis tweaks |
| **MINOR** `0.x.0` | New backward-compatible capability                                                     | Link Health, admin data tools, new API endpoints                                   |
| **MAJOR** `1.0.0` | **Public launch of the site — the map going GA**                                       | reserved; the milestone we're building toward                                      |

Rule of thumb until launch: **minor = feature, patch = fix.** `1.0.0` is the
line we cross when the map is ready and the site is public.

## Conventional Commits

Commit messages drive the version bump and the changelog. Use:

```
<type>(<optional scope>): <summary>
```

| Type                                            | Bumps | Changelog section |
| ----------------------------------------------- | ----- | ----------------- |
| `feat`                                          | MINOR | Added             |
| `fix`                                           | PATCH | Fixed             |
| `perf`                                          | PATCH | Changed           |
| `refactor`                                      | PATCH | Changed           |
| `docs`, `chore`, `test`, `build`, `ci`          | none  | (omitted)         |
| `feat!` / `fix!` or a `BREAKING CHANGE:` footer | MAJOR | Breaking          |

Existing scopes in this repo (`health`, `obs`, …) are fine as the `(scope)`.
A breaking change before 1.0.0 still bumps MINOR (0.x semantics), not MAJOR —
we intentionally hold 1.0.0 for launch.

## How a release works

Releases are **PR-gated** — nothing is published by pushing to `main` directly.

1. Merge normal PRs into `main` with Conventional Commit messages.
2. **release-please** (`.github/workflows/release-please.yml`) reads the commits
   since the last release and keeps a standing **"Release PR"** open that bumps
   `package.json` and updates `CHANGELOG.md`. `fix` / `perf` / `refactor` roll a
   PATCH; a `feat` makes it a MINOR.
3. Merge that Release PR when you want to cut the release — it creates the git
   tag `vX.Y.Z` and a GitHub Release.
4. Vercel auto-deploys `main`, and `@sentry/vite-plugin` creates the matching
   `tattoo-directory@X.Y.Z` Sentry release (sourcemaps + commits) on that build.
   No separate deploy workflow is needed.

> **Reaching 1.0.0:** release-please holds the version below 1.0 automatically
> (`bump-minor-pre-major`), so it never jumps to 1.0 on its own. When the map
> ships and the site goes public, add a `Release-As: 1.0.0` footer to a commit
> to cut `1.0.0`.

### Manual process (fallback)

```bash
npm run version:minor   # or version:patch / version:major (edits package.json only)
# commit the bump in a PR, merge, then tag:
git tag -a v0.3.0 -m "Release 0.3.0" && git push origin v0.3.0
```

`scripts/release.js` (`npm run release`) still exists but pushes straight to
`main`; it will be retired when release-please lands. Prefer the PR flow.

## Sentry release wiring

The release name is **`[email protected]`** everywhere, derived from
`package.json`:

- **Frontend** — `src/utils/sentry.ts` uses the Vite-injected `__SENTRY_RELEASE__`
  (`vite.config.ts` `define`), and `@sentry/vite-plugin` uploads a release of
  the same name with sourcemaps.
- **Backend** — `api/_utils/sentry.ts` sets `release: \`tattoo-directory@${version}\``
  so serverless spans/logs/metrics attach to the version too.

### Dashboard hygiene (to verify in Sentry / Vercel)

The Releases list currently shows **per-commit SHA** releases
(`3071efec…`). Those are created by the **Vercel↔Sentry integration**, which
stamps `SENTRY_RELEASE=<git sha>` per deploy and competes with the semver name.
To make releases read as versions:

- [ ] In the Sentry (or Vercel) integration settings, disable the automatic
      commit-SHA release, or set the release to the app version.
- [ ] Confirm `@sentry/vite-plugin`'s `project` (currently `javascript-react`,
      `vite.config.ts`) matches the project the runtime **DSN** reports to
      (the `trad-directory` project in the Releases screenshot). If they differ,
      sourcemaps are uploading to the wrong project — align them.
- [ ] After the next tagged deploy, confirm a single `[email protected]`
      release appears with events, sourcemaps, and associated commits.

## Alerts to set up (once releases are clean)

- Cron monitor miss (`instagram-link-checker` check-in) — already wired.
- `ig.throttle` spike — Instagram rate-limiting our IP.
- Dead-rate spike via `link.transition{to:dead}`.
- Probe p95 latency regression (`ig.probe.latency_ms`).
- On-demand `checkLink` error rate.
