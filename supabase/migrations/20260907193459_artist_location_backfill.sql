-- P2 Backfill: make artist_location the complete record of every artist's
-- cities and shops, consolidating artists.city_id, artists.secondary_city_id,
-- and artist_shop into it. Writes ONLY artist_location; the source columns/table
-- are left untouched. Runs in a transaction; idempotent (safe to re-run).

-- 0. Drop meaningless rows (neither a city nor a shop).
delete from "public"."artist_location"
where "city_id" is null and "shop_id" is null;

-- 1a. A shop-tied row's city must be the shop's city. Remove any mismatched row
--     that would collide with an already-correct row once its city is fixed.
delete from "public"."artist_location" al
using "public"."tattoo_shops" ts
where al."shop_id" = ts."id"
  and al."city_id" is distinct from ts."city_id"
  and exists (
    select 1 from "public"."artist_location" al2
    where al2."artist_id" = al."artist_id"
      and al2."shop_id" = al."shop_id"
      and al2."city_id" is not distinct from ts."city_id"
  );

-- 1b. Fix the remaining mismatched/null-city shop rows to the shop's city.
update "public"."artist_location" al
set "city_id" = ts."city_id"
from "public"."tattoo_shops" ts
where al."shop_id" = ts."id"
  and al."city_id" is distinct from ts."city_id"
  and ts."city_id" is not null;

-- 2. Add any artist_shop link missing from artist_location (city = shop's city).
insert into "public"."artist_location"
  ("artist_id", "city_id", "shop_id", "is_primary", "role", "sort_order")
select s."artist_id", ts."city_id", s."shop_id", false, 'resident', 0
from "public"."artist_shop" s
join "public"."tattoo_shops" ts on ts."id" = s."shop_id"
where ts."city_id" is not null
  and not exists (
    select 1 from "public"."artist_location" al
    where al."artist_id" = s."artist_id" and al."shop_id" = s."shop_id"
  );

-- 3. Add a primary city row for any artist whose city_id isn't represented.
insert into "public"."artist_location"
  ("artist_id", "city_id", "shop_id", "is_primary", "role", "sort_order")
select a."id", a."city_id", null, true, 'resident', 0
from "public"."artists" a
where a."city_id" is not null
  and not exists (
    select 1 from "public"."artist_location" al
    where al."artist_id" = a."id" and al."city_id" = a."city_id"
  );

-- 4. Add secondary_city rows (non-primary).
insert into "public"."artist_location"
  ("artist_id", "city_id", "shop_id", "is_primary", "role", "sort_order")
select a."id", a."secondary_city_id", null, false, 'resident', 1
from "public"."artists" a
where a."secondary_city_id" is not null
  and not exists (
    select 1 from "public"."artist_location" al
    where al."artist_id" = a."id" and al."city_id" = a."secondary_city_id"
  );

-- 5a. Exactly one primary per artist: demote extra primaries, preferring the row
--     that matches artists.city_id, else the lowest id.
with ranked as (
  select al."id",
         row_number() over (
           partition by al."artist_id"
           order by (case when al."city_id" = a."city_id" then 0 else 1 end), al."id"
         ) as rn
  from "public"."artist_location" al
  join "public"."artists" a on a."id" = al."artist_id"
  where al."is_primary"
)
update "public"."artist_location" al
set "is_primary" = false
from ranked
where al."id" = ranked."id" and ranked."rn" > 1;

-- 5b. Promote a primary for any artist that has rows but none primary
--     (e.g. an artist who only had artist_shop links).
with need as (
  select "artist_id" from "public"."artist_location"
  group by "artist_id" having bool_or("is_primary") = false
),
pick as (
  select distinct on (al."artist_id") al."id"
  from "public"."artist_location" al
  join "public"."artists" a on a."id" = al."artist_id"
  join need n on n."artist_id" = al."artist_id"
  order by al."artist_id",
           (case when al."city_id" = a."city_id" then 0 else 1 end), al."id"
)
update "public"."artist_location" al
set "is_primary" = true
from pick
where al."id" = pick."id";
