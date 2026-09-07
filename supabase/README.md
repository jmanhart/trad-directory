# Database workflow

Schema is managed with the Supabase CLI. Files in `supabase/migrations/` are the
source of truth; they run in order on local, on preview branches, and on prod.

## One-time (per machine)

- Docker running (this project uses colima: `colima start`).
- `supabase login`, then `supabase link --project-ref qxracnhgzceywcqtyvzz`.
- `npm run db:seed:pull` to populate local seed data (see below).

## Make a change (the safe path)

1. `npm run db:new <name>` to create a migration — or change the DB locally and
   `npm run db:diff -f <name>` to capture it.
2. Test locally: `npm run db:start`, then `npm run db:reset` (re-runs every
   migration + loads the seed on a fresh local Postgres 15).
3. Ship: `npm run db:push:safe` — takes a data backup first, then applies
   pending migrations to prod. (Plain `npm run db:push` skips the backup.)

## Column changes: expand -> contract (never rename/drop in one step)

1. **Expand** — add the new column (nullable). Additive and reversible.
2. **Backfill** — populate it from the old column.
3. **Migrate code** — the `api/` handlers AND the `td-chrome-ext` client both
   depend on column shapes (guarded by `check-api-sync.js`). Deploy them reading
   the new column.
4. **Contract** — drop the old column last, in its own migration, after a
   safety window.

Give every migration a matching down/rollback where practical.

## Backups & rollback (Pro plan, no extra cost)

- **Daily backups** are included with Pro (Dashboard -> Database -> Backups).
- **`npm run backup`** exports every table to JSON (`--push` sends it offsite).
- **`npm run db:push:safe`** snapshots before each prod push.
- **PITR is intentionally NOT enabled** — it's a pricey add-on; the above covers us.

## Seed data

`supabase/seed.sql` is the local dataset loaded by `db:reset`. It is gitignored
(regenerate with `npm run db:seed:pull`) and contains only the 7 public directory
tables — no auth/user data.

## Cost notes

- **Local testing is free** — prefer it.
- **Branching** (preview DBs per PR) is pay-per-use compute; enable in the
  dashboard only if you want cloud previews, and close branches after merge.
- **PITR** — skip (expensive).

## Baseline

`*_remote_baseline.sql` captured the existing prod schema when the CLI workflow
was adopted, marked applied via `supabase migration repair` so it is never
re-run against prod.
