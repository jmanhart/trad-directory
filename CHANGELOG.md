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

## [0.3.1](https://github.com/jmanhart/trad-directory/compare/tattoo-directory-v0.3.0...tattoo-directory-v0.3.1) (2026-08-29)


### Fixed

* **api:** replace Promise.withResolvers with plain Promise for Node 20 ([#44](https://github.com/jmanhart/trad-directory/issues/44)) ([fb9aa5d](https://github.com/jmanhart/trad-directory/commit/fb9aa5df8242d7d1b910c328f11d6d6fda484a9c))

## [0.3.0](https://github.com/jmanhart/trad-directory/compare/tattoo-directory-v0.2.0...tattoo-directory-v0.3.0) (2026-08-29)


### Added

* add complete release management system with Sentry integration ([a29aeed](https://github.com/jmanhart/trad-directory/commit/a29aeed159a9faf9872eff2d5b0db51916a04129))
* add comprehensive Sentry integration 🎉 Victory ([f27ab47](https://github.com/jmanhart/trad-directory/commit/f27ab47139f9ea477fa36a2724af41fa3dd898c6))
* add comprehensive Sentry integration 🎉 Victory ([f90770c](https://github.com/jmanhart/trad-directory/commit/f90770c4e819ca7eabf167b0deb3ee4714598b0c))
* Add Valkey caching to MCP API endpoints ([6691fb6](https://github.com/jmanhart/trad-directory/commit/6691fb6b2035fb6aad92ee2897478f455b958899))
* **admin:** add AdminDetailPanel flyout shell ([a964597](https://github.com/jmanhart/trad-directory/commit/a96459788df62f585f404d8dcbd6fab3b539dc3d))
* **admin:** entries-over-time chart on analytics tab ([41854cc](https://github.com/jmanhart/trad-directory/commit/41854cc29c046ec65892bb4dcfab1ffd0b5191fc))
* **admin:** entries-over-time chart on the analytics tab ([425b7ba](https://github.com/jmanhart/trad-directory/commit/425b7ba54265458868886b87dbe9872c5bce6fb6))
* **admin:** replace edit modal with push flyout panel ([7ec4a02](https://github.com/jmanhart/trad-directory/commit/7ec4a02076a15d37f5c1ed9cb3e37d42ff3fee4d))
* **api:** add entryTimeline endpoint ([d1d0573](https://github.com/jmanhart/trad-directory/commit/d1d057346c98ab6c17f77607df75cf874bd599e4))
* **map:** country drill-down + scoped search preview ([13a029c](https://github.com/jmanhart/trad-directory/commit/13a029cc45a017f2378db4a78f00e88bdf432627))
* **map:** country-wide panel with state drill-down + breadcrumbs ([e447c67](https://github.com/jmanhart/trad-directory/commit/e447c6710e79356e3df1f0b5e88be88fdc978f64))
* **map:** explode North America into country dots + click-to-panel ([dd05593](https://github.com/jmanhart/trad-directory/commit/dd0559344c80a300c291e1f853f8d75711236dee))
* **map:** shared map primitives + scoped search-results preview ([54bacf3](https://github.com/jmanhart/trad-directory/commit/54bacf364dfb7bea7628e5003ace57963bd6a682))
* **sentry:** forward console logs to Sentry (prod only) ([e6d99cf](https://github.com/jmanhart/trad-directory/commit/e6d99cf50057faee1bba25ccfd11da7a7d443d7e))
* **sentry:** forward console logs to Sentry (prod only) ([c120a76](https://github.com/jmanhart/trad-directory/commit/c120a765fe580d1d32ff932492caa066650a63ba))
* **storybook:** add component gallery (SB 8.6.18, react-vite) ([60e6418](https://github.com/jmanhart/trad-directory/commit/60e6418c9f7176c69b1d774fe95e0a70b60c4bd5))
* **storybook:** component gallery + fix the failing storybook deploy ([e1f7acd](https://github.com/jmanhart/trad-directory/commit/e1f7acdfebe75e518950179c1f9ab4015ee1ee7e))


### Fixed

* **admin:** address Seer review on the data view ([b25e8d2](https://github.com/jmanhart/trad-directory/commit/b25e8d2e3c569f8ff837d3ce86a11ee87ffce351))
* **admin:** open flyout instantly, load data after ([5c80057](https://github.com/jmanhart/trad-directory/commit/5c800579b6566982e0acb22ee3d26d67ef68b7ab))
* **admin:** refresh entries chart on tab focus ([d43560e](https://github.com/jmanhart/trad-directory/commit/d43560ebe4b554bbf18648a08a91025a752aff16))
* **map:** address Seer review - Other row + region subtitle ([c0f5823](https://github.com/jmanhart/trad-directory/commit/c0f582358981c35edf1772a7e22fd415c58517f6))
* **map:** address Seer review on mobile sheet ([ccbc060](https://github.com/jmanhart/trad-directory/commit/ccbc0609e47b27526efd42dc5988b31038094aec))
* **map:** attach bottom-sheet drag listeners when sheet opens ([b73fc84](https://github.com/jmanhart/trad-directory/commit/b73fc8429425e02f063582f941f66a936a3da921))
* **map:** disable rotate/pitch gestures ([0835f72](https://github.com/jmanhart/trad-directory/commit/0835f7213af2f167d993ed3ebeb86d45170d7b9c))
* **map:** hide zoom controls on mobile ([f271f76](https://github.com/jmanhart/trad-directory/commit/f271f767f67bfe98a0a8866d52191febe3ecbacc))
* **map:** mobile map viewer quick wins ([cdc34da](https://github.com/jmanhart/trad-directory/commit/cdc34da6befa4a4de8ffb48a0d0e7abbf1602242))
* **map:** move mobile zoom controls above bottom sheet ([e9cdd8d](https://github.com/jmanhart/trad-directory/commit/e9cdd8d66ffeda8d3b2eb22aeef3333d396a0e6e))
* **map:** pin panel header + tabs while list scrolls on mobile ([2055360](https://github.com/jmanhart/trad-directory/commit/205536066e71c076f0bf7d0d803996c82fd7fc78))
* **map:** reserve bottom-sheet space in mobile map padding ([bdbd7ea](https://github.com/jmanhart/trad-directory/commit/bdbd7eac31bda7a79c64a0793377cfec6cf9c85c))
* **map:** size mobile bottom sheet with dvh not vh ([07986f4](https://github.com/jmanhart/trad-directory/commit/07986f453f72181f41d056e7ae52e5a65ebbd22f))
* Restore missing MCP API files and update production URL ([64d728c](https://github.com/jmanhart/trad-directory/commit/64d728c307596d1dac55b1cd907ac595c035a87f))
* Update MCP API URL to use correct production domain ([75db1c8](https://github.com/jmanhart/trad-directory/commit/75db1c864e6b6ab98109041fd2fd167f5e7e5c21))
* Update production URL to latest deployment ([303dbb7](https://github.com/jmanhart/trad-directory/commit/303dbb770ee23de7fb302b0a645cab6b244b371c))
* **vercel:** remove invalid functions pattern; no serverless functions; keep Vite build ([43ef689](https://github.com/jmanhart/trad-directory/commit/43ef689a71e9a27c1f92d21b7ee0dcac2a6202a0))


### Changed

* **admin:** consolidate entity pages into one Data view ([3c0729b](https://github.com/jmanhart/trad-directory/commit/3c0729b92eb1cb1eb90e89365251e548e653ec41))
* **admin:** consolidate entity pages into one Data view ([ed2160c](https://github.com/jmanhart/trad-directory/commit/ed2160c15944114c09d4af4d7dacd0ea6b8fa382))
* **admin:** drop stats cards from Data, fix submissions table ([346d5c4](https://github.com/jmanhart/trad-directory/commit/346d5c4a3bdd3e9f880f6da2ffcd5c021d3c62c9))
* **admin:** full-height sidebar, drop top bar on desktop ([4246b04](https://github.com/jmanhart/trad-directory/commit/4246b04658f8e0c5f108d2183f6c696e93825202))

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
- **Automated releases** — a `release-please` GitHub Action maintains a Release
  PR that bumps the version + updates this changelog from Conventional Commits
  (`fix`/`perf`/`refactor` → patch, `feat` → minor; `1.0.0` held for the map
  launch). Documented in a rewritten `RELEASE.md`.

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
