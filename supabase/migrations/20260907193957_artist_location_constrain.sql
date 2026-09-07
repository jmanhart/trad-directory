-- P3 Constrain: enforce the consolidated invariants on artist_location.
-- Must run AFTER the P2 backfill has consolidated existing data:
--   - every location has a city (city_id NOT NULL)
--   - at most one primary location per artist
--
-- Rollback:
--   drop index if exists public.artist_location_one_primary;
--   alter table public.artist_location alter column city_id drop not null;

alter table "public"."artist_location"
  alter column "city_id" set not null;

create unique index if not exists "artist_location_one_primary"
  on "public"."artist_location" ("artist_id")
  where "is_primary";
