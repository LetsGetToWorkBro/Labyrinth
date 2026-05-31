-- Migration: unified_auth_and_stream_tables
-- Created: 2026-05-31
-- Description: Adds tables for Supabase-based unified auth across app.labyrinth.vision
--              and stream.labyrinth.vision, plus stream_status for real-time portal data.

-- ─────────────────────────────────────────────
-- 1. access_requests
--    Stores "Request Access" form submissions.
--    Admin approves → inviteUserByEmail() is called.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  message     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid  -- auth.users.id of the admin who acted on it
);

CREATE INDEX IF NOT EXISTS idx_access_requests_email  ON public.access_requests (email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests (status);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anon users (unauthenticated) can submit requests
CREATE POLICY "Public can insert access requests"
  ON public.access_requests FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated users (admins) can read and manage all requests
CREATE POLICY "Admin can manage access requests"
  ON public.access_requests FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 2. member_profiles
--    Mirrors key GAS member fields into Supabase
--    so the stream portal can display them after login.
--    Auto-created by trigger on auth.users insert.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text UNIQUE NOT NULL,
  name          text,
  belt          text DEFAULT 'white',
  stripes       int  DEFAULT 0,
  checkin_count int  DEFAULT 0,
  xp            int  DEFAULT 0,
  level         int  DEFAULT 1,
  role          text DEFAULT 'member',  -- 'member' | 'coach' | 'admin' | 'owner'
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.member_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role full access profiles"
  ON public.member_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- auto-bump updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_member_profiles_updated_at
  BEFORE UPDATE ON public.member_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- auto-create profile row when Supabase Auth creates a user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.member_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 3. stream_status
--    Single-row table that GAS/admin writes to
--    when a stream goes live or ends. The portal
--    polls this every 30 s via Supabase Realtime.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stream_status (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_live    boolean NOT NULL DEFAULT false,
  video_id   text,
  class_name text,
  instructor text,
  started_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stream_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stream status"
  ON public.stream_status FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role manages stream status"
  ON public.stream_status FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Seed default row (no stream active)
INSERT INTO public.stream_status (is_live, video_id, class_name, instructor)
VALUES (false, '', 'No active stream', '');
