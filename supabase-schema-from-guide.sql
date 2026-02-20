-- ============================================================
-- KETTLEBELL GYM — FULL SUPABASE SCHEMA (from SUPABASE_SETUP_GUIDE.md)
-- Run this entire file in Supabase SQL Editor (one go).
-- Idempotent: safe to run multiple times (DROP IF EXISTS where needed).
-- ============================================================

-- 0. Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  display_name    TEXT,
  age             INT,
  gender          TEXT,
  photo_url       TEXT,
  weight          NUMERIC,
  height          NUMERIC,
  target_weight   NUMERIC,
  body_measurements JSONB DEFAULT '{}',
  fitness_level   TEXT,
  experience      TEXT,
  injuries        TEXT,
  equipment       JSONB DEFAULT '{}',
  goals           JSONB DEFAULT '{}',
  coach_voice     TEXT DEFAULT 'female',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. SUBSCRIPTIONS (Stripe Pro)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  plan                TEXT DEFAULT 'free',
  status              TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 3. WORKOUT SESSIONS (timer-based sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_name    TEXT,
  exercises       JSONB,
  work_seconds    INT,
  rounds          INT,
  total_duration  INT,
  completed_at    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON workout_sessions;
CREATE POLICY "Anyone can insert sessions"
  ON workout_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can read own sessions" ON workout_sessions;
CREATE POLICY "Users can read own sessions"
  ON workout_sessions FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- ============================================================
-- 4. WORKOUT HISTORY (manual workout logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  time            TEXT,
  planned_min     INT,
  actual_min      INT,
  exercises       JSONB,
  total_volume    NUMERIC,
  rpe             INT,
  energy          TEXT,
  modifications   TEXT,
  skipped         TEXT,
  prs             TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own workout history" ON workout_history;
CREATE POLICY "Users can CRUD own workout history"
  ON workout_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 5. BODY METRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS body_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  weight          NUMERIC,
  body_fat        NUMERIC,
  chest           NUMERIC,
  waist           NUMERIC,
  hips            NUMERIC,
  bicep           NUMERIC,
  thigh           NUMERIC,
  photo_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own body metrics" ON body_metrics;
CREATE POLICY "Users can CRUD own body metrics"
  ON body_metrics FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. PERSONAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id     TEXT NOT NULL,
  exercise_name   TEXT NOT NULL,
  weight          NUMERIC,
  reps            INT,
  volume          NUMERIC,
  date            DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own PRs" ON personal_records;
CREATE POLICY "Users can CRUD own PRs"
  ON personal_records FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. USER ROUTINES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_routines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  exercise_ids    JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own routines" ON user_routines;
CREATE POLICY "Users can CRUD own routines"
  ON user_routines FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_days    JSONB DEFAULT '[]',
  rest_days       JSONB DEFAULT '[]',
  deload          JSONB DEFAULT '{}',
  reminders       JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own schedule" ON schedules;
CREATE POLICY "Users can CRUD own schedule"
  ON schedules FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 9. USER GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT,
  target_value    NUMERIC,
  current_value   NUMERIC DEFAULT 0,
  unit            TEXT,
  deadline        DATE,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own goals" ON user_goals;
CREATE POLICY "Users can CRUD own goals"
  ON user_goals FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 10. HELPER: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_schedules_updated_at ON schedules;
CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_goals_updated_at ON user_goals;
CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
