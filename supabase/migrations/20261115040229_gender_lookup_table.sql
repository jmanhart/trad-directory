-- Gender lookup table (EXPAND phase).
--
-- Replaces the free-text `artists.gender` column with a scalable reference
-- table + FK, matching the countries/states/cities pattern. This migration is
-- additive + backfill only: nothing reads `gender_id` yet, and the old
-- `gender` text column stays in place until a later CONTRACT migration drops
-- it, after the app and the td-chrome-ext client have cut over.

-- 1. Lookup table ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."genders" (
    "id" bigint NOT NULL,
    "label" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."genders" OWNER TO "postgres";

ALTER TABLE "public"."genders" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."genders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY "public"."genders"
    ADD CONSTRAINT "genders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."genders"
    ADD CONSTRAINT "genders_slug_key" UNIQUE ("slug");

-- Public read, like the other reference tables. Writes go via the service key.
ALTER TABLE "public"."genders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "genders_select_public" ON "public"."genders"
    FOR SELECT USING (true);

GRANT ALL ON TABLE "public"."genders" TO "anon";
GRANT ALL ON TABLE "public"."genders" TO "authenticated";
GRANT ALL ON TABLE "public"."genders" TO "service_role";
GRANT ALL ON SEQUENCE "public"."genders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."genders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."genders_id_seq" TO "service_role";

-- 2. Seed the starting buckets (scale up later by inserting a row) -----------
INSERT INTO "public"."genders" ("label", "slug", "sort_order")
VALUES
    ('Male', 'male', 1),
    ('Female', 'female', 2),
    ('Non-binary', 'non-binary', 3),
    ('Other', 'other', 4)
ON CONFLICT ("slug") DO NOTHING;

-- 3. FK column on artists (nullable; NULL = not specified) -------------------
ALTER TABLE "public"."artists"
    ADD COLUMN IF NOT EXISTS "gender_id" bigint;

ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_gender_id_fkey" FOREIGN KEY ("gender_id")
    REFERENCES "public"."genders"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_artists_gender_id"
    ON "public"."artists" USING "btree" ("gender_id");

-- 4. Backfill from the old free-text column ----------------------------------
-- Male/male -> male; Female/female/Femal -> female; exact Non-binary / Other.
-- NULL or unrecognized values stay NULL (not specified). Re-runnable.
UPDATE "public"."artists" a
SET "gender_id" = g."id"
FROM "public"."genders" g
WHERE a."gender_id" IS NULL
  AND a."gender" IS NOT NULL
  AND (
    (g."slug" = 'male'       AND lower(trim(a."gender")) = 'male') OR
    (g."slug" = 'female'     AND lower(trim(a."gender")) IN ('female', 'femal')) OR
    (g."slug" = 'non-binary' AND lower(trim(a."gender")) = 'non-binary') OR
    (g."slug" = 'other'      AND lower(trim(a."gender")) = 'other')
  );
