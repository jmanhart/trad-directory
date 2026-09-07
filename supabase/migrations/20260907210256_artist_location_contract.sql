-- P5 Contract (destructive, final): drop the legacy location sources now that
-- everything reads/writes artist_location. Run ONLY after the code cutover is
-- deployed. A fresh backup is taken before this is pushed to prod.
--
-- Rollback: restore from the pre-push backup (these objects + their data go away).

-- View that joined artist_shop (superseded by artist_location).
drop view if exists "public"."artist_shop_view";

-- Redundant artist<->shop junction (now expressed as artist_location rows with shop_id).
drop table if exists "public"."artist_shop";

-- Redundant primary/secondary city columns on artists (now the artist's
-- artist_location rows; primary row = the old city_id).
alter table "public"."artists" drop column if exists "secondary_city_id";
alter table "public"."artists" drop column if exists "city_id";
