# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Pre-1.0.0 the version means: **MINOR** = new backward-compatible features,
**PATCH** = fixes and internal work. **1.0.0** marks the public launch of the
site (the map going GA). See [RELEASE.md](./RELEASE.md) for the full policy.

From the next tagged release onward this file is maintained automatically by
[release-please](https://github.com/googleapis/release-please) from
[Conventional Commits](https://www.conventionalcommits.org/) — do not hand-edit
released sections.

## [Unreleased]

### Added

- **Backend observability for the link-health workflow** — a shared
  `api/_utils/sentry.ts` init turns on tracing, structured logs, and metrics
  for the serverless functions (previously `dsn`-only, so all three were
  no-ops). The Instagram probe emits a span per request (latency + result) plus
  `ig.probe` / `ig.probe.latency_ms` / `ig.throttle` metrics; the cron wraps
  each wave in a root span and logs every status transition + a wave summary
  (`link.transition`, `link_health.wave`, `link_health.due_remaining`); the
  on-demand Check Link is spanned, logged, and flushed.
- **Semantic-versioned Sentry releases** (`[email protected]`) across the
  frontend and backend, replacing the per-commit SHA release names.
- **Release workflow bones** — this changelog and a rewritten `RELEASE.md`
  documenting the SemVer policy, Conventional Commits, and the planned
  release-please automation.

## [0.2.0]

### Added

- **Link Health ("link-pulse")** — a reliable unauthenticated Instagram
  existence probe, a confidence-based state machine
  (`unchecked` / `alive` / `suspect` / `dead` / `unknown`, dead only after 3
  consecutive dead probes), and a priority-wave cron checker with rate-limit
  backoff.
- **Admin Link Health view** — filterable by status, per-row **Check Link**
  (live probe), Ignore / Recheck actions, and an Edit deep-link into the data
  browser.
- **Data-browser link health** — a clickable status pill (one-click live
  check) and link-health fields (status, last alive, last checked) in the
  detail flyout.
- **Compact table locations** — city in full with US / Canadian / Australian
  state and country abbreviations (e.g. `Seattle, WA, US`), truncating with an
  ellipsis when still too long; full names preserved in the detail flyout.

### Changed

- Shops data table drops the **Address** column so the Shop Name fits on one
  line; address remains in the detail flyout and is still searchable.

_History before 0.2.0 predates this changelog._

[Unreleased]: https://github.com/jmanhart/trad-directory/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/jmanhart/trad-directory/releases/tag/v0.2.0
