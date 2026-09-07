-- Artist styles: a catalog of tattoo styles (with optional grouping) and a
-- many-to-many link to artists, for filtering. All NEW tables — additive, no
-- existing data touched. Artists get tagged over time via the admin.
--
-- Rollback:
--   drop table if exists public.artist_styles;
--   drop table if exists public.styles;
--   drop table if exists public.style_categories;

-- 1. style_categories — optional grouping (populate/assign over time)
create table if not exists "public"."style_categories" (
  "id" bigint generated always as identity primary key,
  "name" text not null unique,
  "slug" text not null unique,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now()
);

-- 2. styles — the catalog
create table if not exists "public"."styles" (
  "id" bigint generated always as identity primary key,
  "name" text not null unique,
  "slug" text not null unique,
  "category_id" bigint references "public"."style_categories"("id") on delete set null,
  "description" text,
  "sort_order" integer not null default 0,
  "is_active" boolean not null default true,
  "created_at" timestamptz not null default now()
);
create index if not exists "idx_styles_category_id" on "public"."styles" ("category_id");

-- 3. artist_styles — many-to-many (an artist specializes in many styles)
create table if not exists "public"."artist_styles" (
  "artist_id" bigint not null references "public"."artists"("id") on delete cascade,
  "style_id" bigint not null references "public"."styles"("id") on delete cascade,
  "is_primary" boolean not null default false,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now(),
  primary key ("artist_id", "style_id")
);
create index if not exists "idx_artist_styles_style_id" on "public"."artist_styles" ("style_id");
create index if not exists "idx_artist_styles_artist_id" on "public"."artist_styles" ("artist_id");

-- RLS: public read; writes go through the service role (admin), which bypasses RLS.
alter table "public"."style_categories" enable row level security;
create policy "style_categories_select_public" on "public"."style_categories" for select using (true);

alter table "public"."styles" enable row level security;
create policy "styles_select_public" on "public"."styles" for select using (true);

alter table "public"."artist_styles" enable row level security;
create policy "artist_styles_select_public" on "public"."artist_styles" for select using (true);

-- Grants (match project convention)
grant select on "public"."style_categories" to "anon", "authenticated";
grant all on "public"."style_categories" to "service_role";
grant select on "public"."styles" to "anon", "authenticated";
grant all on "public"."styles" to "service_role";
grant select on "public"."artist_styles" to "anon", "authenticated";
grant all on "public"."artist_styles" to "service_role";

-- Starter catalog (category left null — group them later via admin).
insert into "public"."styles" ("name", "slug", "sort_order") values
  ('Japanese', 'japanese', 10),
  ('Old School', 'old-school', 20),
  ('Neo-Traditional', 'neo-traditional', 30),
  ('Fine Line', 'fine-line', 40),
  ('Blackwork', 'blackwork', 50),
  ('Black & Grey', 'black-and-grey', 60),
  ('Realism', 'realism', 70),
  ('Illustrative', 'illustrative', 80),
  ('Lettering', 'lettering', 90),
  ('Dotwork', 'dotwork', 100),
  ('Geometric', 'geometric', 110),
  ('Ornamental', 'ornamental', 120),
  ('New School', 'new-school', 130),
  ('Watercolor', 'watercolor', 140),
  ('Tribal', 'tribal', 150)
on conflict ("slug") do nothing;
