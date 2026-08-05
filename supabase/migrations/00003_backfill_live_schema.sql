-- Backfill migration: captures the live schema that was created manually
-- through the Supabase dashboard and was never represented in a migration file.
-- Safe to re-run against a database where these objects already exist.

-- ============================================================
-- 1. Extensions (Supabase platform defaults, referenced by tables)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- ============================================================
-- 2. Tables
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "read" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "surname" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "proof_of_identity" "text",
    "avatar_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "username" "text"
);

CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_type" "text" NOT NULL,
    "property_details" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" integer NOT NULL,
    "address" "text" NOT NULL,
    "toilets" integer NOT NULL,
    "units_available" integer NOT NULL,
    "image_urls" "text"[],
    "created_at" timestamp without time zone DEFAULT "now"()
);

-- ============================================================
-- 3. Primary keys, unique constraints, and foreign keys
--    (guarded so the migration is safe to re-run)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_pkey') THEN
    ALTER TABLE ONLY "public"."messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey') THEN
    ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
    ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_pkey') THEN
    ALTER TABLE ONLY "public"."properties" ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_property_id_fkey') THEN
    ALTER TABLE ONLY "public"."messages"
      ADD CONSTRAINT "messages_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_fkey') THEN
    ALTER TABLE ONLY "public"."messages"
      ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "auth"."users"("id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey') THEN
    ALTER TABLE ONLY "public"."messages"
      ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey') THEN
    ALTER TABLE ONLY "public"."profiles"
      ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_user_id_fkey') THEN
    ALTER TABLE ONLY "public"."properties"
      ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END;
$$;

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");

-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS policies (guarded so the migration is safe to re-run)
-- ============================================================

-- properties
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Anyone can view properties') THEN
    CREATE POLICY "Anyone can view properties" ON "public"."properties" FOR SELECT USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can insert their own properties') THEN
    CREATE POLICY "Users can insert their own properties" ON "public"."properties" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can update their own properties') THEN
    CREATE POLICY "Users can update their own properties" ON "public"."properties" FOR UPDATE USING (("auth"."uid"() = "user_id"));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'properties' AND policyname = 'Users can delete their own properties') THEN
    CREATE POLICY "Users can delete their own properties" ON "public"."properties" FOR DELETE USING (("auth"."uid"() = "user_id"));
  END IF;
END;
$$;

-- profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));
  END IF;
END;
$$;

-- messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can send messages') THEN
    CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can view their messages') THEN
    CREATE POLICY "Users can view their messages" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));
  END IF;
END;
$$;

-- Row-access policy: receivers may update messages they received.
-- Column-level enforcement (only `read` may change) is handled by the
-- BEFORE UPDATE trigger below, which uses OLD/NEW and avoids the
-- snapshot-visibility ambiguity of a self-join inside WITH CHECK.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can mark messages as read') THEN
    CREATE POLICY "Users can mark messages as read" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "receiver_id"));
  END IF;
END;
$$;

-- ============================================================
-- 7. Column-level enforcement for message updates (trigger)
--    A receiver may only flip `read` from false to true. They may
--    NOT alter content, sender_id, receiver_id, property_id, id,
--    or created_at.
-- ============================================================
CREATE OR REPLACE FUNCTION "public"."enforce_message_read_only_update"()
RETURNS TRIGGER
LANGUAGE "plpgsql"
AS $$
BEGIN
  -- Only receivers may update a message (RLS already restricts row access,
  -- but guard here for defense-in-depth).
  IF "auth"."uid"() = OLD.receiver_id THEN
    -- The only permitted change: `read` going from false to true.
    IF NEW.read IS DISTINCT FROM OLD.read THEN
      IF NOT (NEW.read = true AND OLD.read = false) THEN
        RAISE EXCEPTION 'Messages can only be marked as read (read may only change from false to true).';
      END IF;
    END IF;

    -- All other columns must remain unchanged.
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
       OR NEW.property_id IS DISTINCT FROM OLD.property_id
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Receivers may only update the read column on messages.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "messages_read_only_update_trigger" ON "public"."messages";
CREATE TRIGGER "messages_read_only_update_trigger"
BEFORE UPDATE ON "public"."messages"
FOR EACH ROW
EXECUTE FUNCTION "public"."enforce_message_read_only_update"();

-- ============================================================
-- 8. Realtime publication
--    Guarded so it is safe to re-run against a database where
--    messages is already published.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";
  END IF;
END;
$$;