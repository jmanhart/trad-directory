


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_slug"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
END;
$$;


ALTER FUNCTION "public"."generate_slug"("name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_artist_slug"("name" "text", "id" bigint) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  base_slug := generate_slug(name);
  
  -- Check if base slug already exists (excluding current record)
  IF EXISTS (SELECT 1 FROM artists WHERE slug = base_slug AND artists.id != generate_unique_artist_slug.id) THEN
    final_slug := base_slug || '-' || id::TEXT;
  ELSE
    final_slug := base_slug;
  END IF;
  
  RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_artist_slug"("name" "text", "id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_shop_slug"("name" "text", "id" bigint) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  base_slug := generate_slug(name);
  
  -- Check if base slug already exists (excluding current record)
  IF EXISTS (SELECT 1 FROM tattoo_shops WHERE slug = base_slug AND tattoo_shops.id != generate_unique_shop_slug.id) THEN
    final_slug := base_slug || '-' || id::TEXT;
  ELSE
    final_slug := base_slug;
  END IF;
  
  RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_shop_slug"("name" "text", "id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Safely extract name from metadata if it exists
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_name := NEW.raw_user_meta_data->>'name';
  END IF;
  
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(user_name, ''));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artist_location" (
    "id" bigint NOT NULL,
    "artist_id" bigint NOT NULL,
    "city_id" bigint,
    "shop_id" bigint,
    "is_primary" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."artist_location" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."artist_location_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."artist_location_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."artist_location_id_seq" OWNED BY "public"."artist_location"."id";



CREATE TABLE IF NOT EXISTS "public"."artist_shop" (
    "artist_id" bigint NOT NULL,
    "shop_id" bigint NOT NULL
);


ALTER TABLE "public"."artist_shop" OWNER TO "postgres";


COMMENT ON COLUMN "public"."artist_shop"."artist_id" IS 'Artist key';



CREATE TABLE IF NOT EXISTS "public"."artists" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "instagram_handle" "text",
    "city_id" bigint,
    "gender" "text",
    "url" "text",
    "contact" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_traveling" boolean DEFAULT false,
    "slug" character varying(255),
    "secondary_city_id" bigint
);


ALTER TABLE "public"."artists" OWNER TO "postgres";


COMMENT ON COLUMN "public"."artists"."is_traveling" IS 'Indicates if the artist is primarily a traveling/guest artist. Can still have a home city.';



CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" bigint NOT NULL,
    "city_name" "text" NOT NULL,
    "region" "text",
    "country_id" bigint,
    "state_id" bigint,
    "state_abbreviation" character(2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "latitude" double precision,
    "longitude" double precision
);


ALTER TABLE "public"."cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" bigint NOT NULL,
    "country_name" "text" NOT NULL,
    "country_code" character(2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "continent" "text"
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."states" (
    "id" bigint NOT NULL,
    "state_name" "text" NOT NULL,
    "state_abbreviation" character varying(3) NOT NULL,
    "country_id" bigint
);


ALTER TABLE "public"."states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tattoo_shops" (
    "id" bigint NOT NULL,
    "shop_name" "text" NOT NULL,
    "city_id" bigint,
    "address" "text",
    "phone_number" "text",
    "instagram_handle" "text",
    "website_url" "text",
    "contact" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "slug" character varying(255)
);


ALTER TABLE "public"."tattoo_shops" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."artist_shop_view" WITH ("security_invoker"='on') AS
 SELECT "a"."id" AS "artist_id",
    "a"."name" AS "artist_name",
    "a"."instagram_handle" AS "artist_instagram",
    "ts"."id" AS "shop_id",
    "ts"."shop_name",
    "ts"."address" AS "shop_address",
    "ts"."phone_number" AS "shop_phone",
    "ts"."instagram_handle" AS "shop_instagram",
    "ts"."website_url" AS "shop_website",
    "c"."city_name",
    "s"."state_name",
    "ctr"."country_name"
   FROM ((((("public"."artists" "a"
     LEFT JOIN "public"."artist_shop" "ash" ON (("a"."id" = "ash"."artist_id")))
     LEFT JOIN "public"."tattoo_shops" "ts" ON (("ash"."shop_id" = "ts"."id")))
     LEFT JOIN "public"."cities" "c" ON (("ts"."city_id" = "c"."id")))
     LEFT JOIN "public"."states" "s" ON (("c"."state_id" = "s"."id")))
     LEFT JOIN "public"."countries" "ctr" ON (("c"."country_id" = "ctr"."id")));


ALTER TABLE "public"."artist_shop_view" OWNER TO "postgres";


ALTER TABLE "public"."artists" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."artists_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."cities" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."cities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."countries" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."countries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."link_check_cursor" (
    "id" integer DEFAULT 1 NOT NULL,
    "current_offset" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "link_check_cursor_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."link_check_cursor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."link_check_results" (
    "id" bigint NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" bigint NOT NULL,
    "entity_name" "text",
    "instagram_handle" "text" NOT NULL,
    "status_code" integer,
    "error_message" "text",
    "is_broken" boolean DEFAULT false NOT NULL,
    "checked_at" timestamp with time zone,
    "status" "text" DEFAULT 'unchecked'::"text" NOT NULL,
    "fail_streak" integer DEFAULT 0 NOT NULL,
    "last_alive_at" timestamp with time zone,
    "next_check_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ignored" boolean DEFAULT false NOT NULL,
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "link_check_results_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['artist'::"text", 'shop'::"text"]))),
    CONSTRAINT "link_check_results_status_check" CHECK (("status" = ANY (ARRAY['unchecked'::"text", 'alive'::"text", 'suspect'::"text", 'dead'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."link_check_results" OWNER TO "postgres";


ALTER TABLE "public"."link_check_results" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."link_check_results_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_artists" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "artist_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_artists" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."saved_artists_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."saved_artists_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."saved_artists_id_seq" OWNED BY "public"."saved_artists"."id";



ALTER TABLE "public"."states" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."states_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "submission_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "reason" "text",
    "artist_name" "text",
    "artist_instagram_handle" "text",
    "artist_city" "text",
    "artist_state" "text",
    "artist_country" "text",
    "artist_shop_name" "text",
    "artist_shop_instagram_handle" "text",
    "details" "text",
    "reporter_email" "text",
    "page_url" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    CONSTRAINT "submissions_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['artist'::"text", 'shop'::"text"]))),
    CONSTRAINT "submissions_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text", 'added'::"text", 'deleted'::"text"]))),
    CONSTRAINT "submissions_submission_type_check" CHECK (("submission_type" = ANY (ARRAY['report'::"text", 'new_artist'::"text"])))
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


ALTER TABLE "public"."tattoo_shops" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."tattoo_shops_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."artist_location" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."artist_location_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."saved_artists" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."saved_artists_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."artist_location"
    ADD CONSTRAINT "artist_location_artist_id_city_id_shop_id_key" UNIQUE ("artist_id", "city_id", "shop_id");



ALTER TABLE ONLY "public"."artist_location"
    ADD CONSTRAINT "artist_location_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artist_shop"
    ADD CONSTRAINT "artist_shop_pkey" PRIMARY KEY ("artist_id", "shop_id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_country_code_key" UNIQUE ("country_code");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_check_cursor"
    ADD CONSTRAINT "link_check_cursor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_check_results"
    ADD CONSTRAINT "link_check_results_entity_type_entity_id_key" UNIQUE ("entity_type", "entity_id");



ALTER TABLE ONLY "public"."link_check_results"
    ADD CONSTRAINT "link_check_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_artists"
    ADD CONSTRAINT "saved_artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_artists"
    ADD CONSTRAINT "saved_artists_user_id_artist_id_key" UNIQUE ("user_id", "artist_id");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tattoo_shops"
    ADD CONSTRAINT "tattoo_shops_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_artists_created_at" ON "public"."artists" USING "btree" ("created_at" DESC) WHERE ("created_at" IS NOT NULL);



CREATE INDEX "idx_artists_is_traveling" ON "public"."artists" USING "btree" ("is_traveling") WHERE ("is_traveling" = true);



CREATE INDEX "idx_artists_slug" ON "public"."artists" USING "btree" ("slug");



CREATE INDEX "idx_cities_created_at" ON "public"."cities" USING "btree" ("created_at" DESC) WHERE ("created_at" IS NOT NULL);



CREATE INDEX "idx_countries_created_at" ON "public"."countries" USING "btree" ("created_at" DESC) WHERE ("created_at" IS NOT NULL);



CREATE INDEX "idx_link_check_next_check" ON "public"."link_check_results" USING "btree" ("next_check_at");



CREATE INDEX "idx_link_check_results_broken" ON "public"."link_check_results" USING "btree" ("is_broken") WHERE ("is_broken" = true);



CREATE INDEX "idx_link_check_status" ON "public"."link_check_results" USING "btree" ("status");



CREATE INDEX "idx_saved_artists_artist_id" ON "public"."saved_artists" USING "btree" ("artist_id");



CREATE INDEX "idx_saved_artists_user_id" ON "public"."saved_artists" USING "btree" ("user_id");



CREATE INDEX "idx_submissions_created_at" ON "public"."submissions" USING "btree" ("created_at");



CREATE INDEX "idx_submissions_entity" ON "public"."submissions" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_submissions_status" ON "public"."submissions" USING "btree" ("status");



CREATE INDEX "idx_submissions_type" ON "public"."submissions" USING "btree" ("submission_type");



CREATE INDEX "idx_tattoo_shops_created_at" ON "public"."tattoo_shops" USING "btree" ("created_at" DESC) WHERE ("created_at" IS NOT NULL);



CREATE INDEX "idx_tattoo_shops_slug" ON "public"."tattoo_shops" USING "btree" ("slug");



ALTER TABLE ONLY "public"."artist_location"
    ADD CONSTRAINT "artist_location_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_location"
    ADD CONSTRAINT "artist_location_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artist_location"
    ADD CONSTRAINT "artist_location_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."tattoo_shops"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artist_shop"
    ADD CONSTRAINT "artist_shop_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artist_shop"
    ADD CONSTRAINT "artist_shop_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."tattoo_shops"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_secondary_city_id_fkey" FOREIGN KEY ("secondary_city_id") REFERENCES "public"."cities"("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_artists"
    ADD CONSTRAINT "saved_artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id");



ALTER TABLE ONLY "public"."tattoo_shops"
    ADD CONSTRAINT "tattoo_shops_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id");



CREATE POLICY "Allow anon delete on artist_shop" ON "public"."artist_shop" FOR DELETE TO "anon" USING (true);



CREATE POLICY "Allow anon insert on artist_shop" ON "public"."artist_shop" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert on cities" ON "public"."cities" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert on countries" ON "public"."countries" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert on states" ON "public"."states" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert on tattoo_shops" ON "public"."tattoo_shops" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon update on artists" ON "public"."artists" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anon update on cities" ON "public"."cities" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anon update on countries" ON "public"."countries" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow anon update on tattoo_shops" ON "public"."tattoo_shops" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."artist_shop" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."countries" FOR SELECT USING (true);



CREATE POLICY "Users can delete own saved artists" ON "public"."saved_artists" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own saved artists" ON "public"."saved_artists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own saved artists" ON "public"."saved_artists" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view profiles" ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."artist_location" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "artist_location_select_public" ON "public"."artist_location" FOR SELECT USING (true);



ALTER TABLE "public"."artist_shop" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "artists_select_public" ON "public"."artists" FOR SELECT USING (true);



ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cities_select_public" ON "public"."cities" FOR SELECT USING (true);



ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."link_check_cursor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."link_check_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "states_select_public" ON "public"."states" FOR SELECT USING (true);



ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "submissions_insert_public" ON "public"."submissions" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."tattoo_shops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tattoo_shops_select_public" ON "public"."tattoo_shops" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."generate_slug"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_artist_slug"("name" "text", "id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_artist_slug"("name" "text", "id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_artist_slug"("name" "text", "id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_shop_slug"("name" "text", "id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_shop_slug"("name" "text", "id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_shop_slug"("name" "text", "id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



























GRANT ALL ON TABLE "public"."artist_location" TO "anon";
GRANT ALL ON TABLE "public"."artist_location" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_location" TO "service_role";



GRANT ALL ON SEQUENCE "public"."artist_location_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."artist_location_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."artist_location_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."artist_shop" TO "anon";
GRANT ALL ON TABLE "public"."artist_shop" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_shop" TO "service_role";



GRANT ALL ON TABLE "public"."artists" TO "anon";
GRANT ALL ON TABLE "public"."artists" TO "authenticated";
GRANT ALL ON TABLE "public"."artists" TO "service_role";



GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON TABLE "public"."states" TO "anon";
GRANT ALL ON TABLE "public"."states" TO "authenticated";
GRANT ALL ON TABLE "public"."states" TO "service_role";



GRANT ALL ON TABLE "public"."tattoo_shops" TO "anon";
GRANT ALL ON TABLE "public"."tattoo_shops" TO "authenticated";
GRANT ALL ON TABLE "public"."tattoo_shops" TO "service_role";



GRANT ALL ON TABLE "public"."artist_shop_view" TO "anon";
GRANT ALL ON TABLE "public"."artist_shop_view" TO "authenticated";
GRANT ALL ON TABLE "public"."artist_shop_view" TO "service_role";



GRANT ALL ON SEQUENCE "public"."artists_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."artists_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."artists_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cities_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."link_check_cursor" TO "anon";
GRANT ALL ON TABLE "public"."link_check_cursor" TO "authenticated";
GRANT ALL ON TABLE "public"."link_check_cursor" TO "service_role";



GRANT ALL ON TABLE "public"."link_check_results" TO "anon";
GRANT ALL ON TABLE "public"."link_check_results" TO "authenticated";
GRANT ALL ON TABLE "public"."link_check_results" TO "service_role";



GRANT ALL ON SEQUENCE "public"."link_check_results_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."link_check_results_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."link_check_results_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."saved_artists" TO "anon";
GRANT ALL ON TABLE "public"."saved_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_artists" TO "service_role";



GRANT ALL ON SEQUENCE "public"."saved_artists_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."saved_artists_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."saved_artists_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."states_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tattoo_shops_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tattoo_shops_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tattoo_shops_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































