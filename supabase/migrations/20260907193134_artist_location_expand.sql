-- P1 Expand: add per-location `role` + `sort_order` to artist_location.
--
-- Additive and safe: NOT NULL columns with a default don't rewrite existing rows
-- (Postgres 11+ stores the default in catalog), and every existing row takes
-- role='resident', which satisfies the CHECK. No reads/writes change here.
--
-- Rollback:
--   alter table public.artist_location
--     drop constraint artist_location_role_check,
--     drop column role,
--     drop column sort_order;

alter table "public"."artist_location"
  add column if not exists "role" "text" not null default 'resident',
  add column if not exists "sort_order" integer not null default 0;

alter table "public"."artist_location"
  add constraint "artist_location_role_check"
  check ("role" in ('resident', 'guest', 'owner'));

comment on column "public"."artist_location"."role" is
  'Artist''s relationship to this location: resident | guest | owner.';
comment on column "public"."artist_location"."sort_order" is
  'Display order for an artist''s non-primary locations (ascending).';
