# Kettlebell Gym — Supabase Database & Integration Guide

> Complete step-by-step instructions for setting up a Supabase Postgres database, connecting it to the Kettlebell Gym Vite + React app, and deploying on Vercel.  
> This document is split into two sections:  
> **Part A** — What YOU do in the Supabase dashboard (manual steps)  
> **Part B** — What CURSOR does in the codebase (code changes, copy-paste ready)

---

## Table of Contents

1. [App Architecture Summary](#1-app-architecture-summary)
2. [What Needs a Database](#2-what-needs-a-database)
3. [Database Schema Design](#3-database-schema-design)
4. [APIs & Services Required](#4-apis--services-required)
5. [MCP Servers & Dev Tools](#5-mcp-servers--dev-tools)

---

### PART A — YOUR MANUAL STEPS (Supabase Dashboard)

6. [A1: Create a Supabase Project](#a1-create-a-supabase-project)
7. [A2: Run the Database Schema SQL](#a2-run-the-database-schema-sql)
8. [A3: Enable Auth Providers](#a3-enable-auth-providers)
9. [A4: Configure Auth URLs & Redirects](#a4-configure-auth-urls--redirects)
10. [A5: Set Up Storage Buckets](#a5-set-up-storage-buckets)
11. [A6: Copy Your API Keys](#a6-copy-your-api-keys)
12. [A7: Set Environment Variables in Vercel](#a7-set-environment-variables-in-vercel)
13. [A8: Deploy Edge Functions (Stripe — optional)](#a8-deploy-edge-functions-stripe--optional)

---

### PART B — CURSOR CODE CHANGES

14. [B1: Install Dependencies](#b1-install-dependencies)
15. [B2: Create / Update .env and .env.example](#b2-create--update-env-and-envexample)
16. [B3: Update src/lib/supabase.js — Supabase Client](#b3-update-srclibsupabasejs--supabase-client)
17. [B4: Create src/contexts/AuthContext.jsx](#b4-create-srccontextsauthcontextjsx)
18. [B5: Update src/main.jsx — Wrap with AuthProvider](#b5-update-srcmainjsx--wrap-with-authprovider)
19. [B6: Create Auth Components](#b6-create-auth-components)
20. [B7: Create / Update Service Layer — Sync localStorage to Supabase](#b7-create--update-service-layer--sync-localstorage-to-supabase)
21. [B8: Update Existing Storage Libs — Dual Write](#b8-update-existing-storage-libs--dual-write)
22. [B9: Create Profile Photo Upload Service](#b9-create-profile-photo-upload-service)
23. [B10: Create Pro Subscription Gate Components](#b10-create-pro-subscription-gate-components)
24. [B11: Add Vercel Serverless Functions for Stripe](#b11-add-vercel-serverless-functions-for-stripe)
25. [B12: Update vite.config.js](#b12-update-viteconfigjs)
26. [B13: Update Vercel Environment Variables](#b13-update-vercel-environment-variables)
27. [B14: Test Checklist](#b14-test-checklist)

---

## 1. App Architecture Summary

```
Kettlebell Gym
├── Frontend:      Vite + React 18, React Router 6, CSS Modules, Recharts
├── Hosting:       Vercel (static + serverless Edge functions)
├── Current data:  localStorage (profile, workouts, body, PRs, schedule)
│                  IndexedDB (user routines — KettlebellUserRoutines)
│                  Optional Supabase (workout_sessions only)
├── Auth:          None currently (UPDATED_STRUCTURE.md plans Supabase Auth)
├── Payments:      None currently (UPDATED_STRUCTURE.md plans Stripe)
├── TTS:           OpenAI API via Vercel Edge (api/tts/stream.js)
└── AI:            Local analysis engine (no external API)
```

**After Supabase integration the architecture becomes:**

```
Frontend (Vercel)
    ↕  @supabase/supabase-js  ↕
Supabase (Hosted Postgres + Auth + Storage + Edge Functions)
    ├── Auth:            Email/password, magic link, OAuth (Google)
    ├── Database:        profiles, subscriptions, workout_sessions,
    │                    user_routines, body_metrics, personal_records,
    │                    schedules, user_goals, workout_history
    ├── Storage:         profile-photos bucket
    ├── Edge Functions:  create-checkout-session, stripe-webhook,
    │                    create-portal-session (Stripe)
    └── RLS:             Row-Level Security on every table
```

---

## 2. What Needs a Database

| Data | Current Storage | Move to Supabase? | Why |
|------|----------------|-------------------|-----|
| Profile (name, age, goals, equipment) | localStorage `kettlebell-profile` | ✅ Yes → `profiles` table | Persist across devices, tie to auth |
| Workout log | localStorage `kettlebell-workouts` | ✅ Yes → `workout_history` table | Cross-device sync, analytics |
| Body metrics | localStorage `kettlebell-body-metrics` | ✅ Yes → `body_metrics` table | Historical tracking |
| Personal records | localStorage `kettlebell-prs` | ✅ Yes → `personal_records` table | Persist across devices |
| Schedule | localStorage `kettlebell-schedule` | ✅ Yes → `schedules` table | Sync across devices |
| User routines | IndexedDB `KettlebellUserRoutines` | ✅ Yes → `user_routines` table | Cloud backup |
| Session history | Optional Supabase `workout_sessions` | ✅ Keep → `workout_sessions` | Already planned |
| Subscription/Pro status | None | ✅ New → `subscriptions` table | Stripe integration |
| User goals | None | ✅ New → `user_goals` table | Pro feature |
| Coach voice preference | localStorage in profile | Keep in `profiles` column | Part of profile |
| Exercise data (30 exercises) | `src/data/exercises.js` | ❌ No — static | Doesn't change per user |
| Curated routines | `src/lib/routines.js` | ❌ No — static | App-level content |
| Exercise media | `public/exercise-media/` | ❌ No — static files | Served by Vercel CDN |

---

## 3. Database Schema Design

> This is the complete SQL you will paste into Supabase's SQL Editor (see step A2).

```sql
-- ============================================================
-- KETTLEBELL GYM — FULL SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor (one go)
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
  photo_url       TEXT,             -- Supabase Storage URL
  weight          NUMERIC,
  height          NUMERIC,
  target_weight   NUMERIC,
  body_measurements JSONB DEFAULT '{}',  -- { chest, waist, hips, ... }
  fitness_level   TEXT,             -- beginner / intermediate / advanced
  experience      TEXT,
  injuries        TEXT,
  equipment       JSONB DEFAULT '{}',  -- { kettlebellWeights, otherEquipment, space }
  goals           JSONB DEFAULT '{}',  -- { primary, secondary, timeline, ... }
  coach_voice     TEXT DEFAULT 'female', -- off / female / male
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile row when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
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
  plan                TEXT DEFAULT 'free',   -- free / pro
  status              TEXT DEFAULT 'active', -- active / canceled / past_due
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Insert/update via Edge Functions (service_role key), not client

-- ============================================================
-- 3. WORKOUT SESSIONS (timer-based sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_name    TEXT,
  exercises       JSONB,          -- [{ id, name, ... }]
  work_seconds    INT,
  rounds          INT,
  total_duration  INT,            -- seconds
  completed_at    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
-- Allow anonymous insert (backward compat) + authenticated users
CREATE POLICY "Anyone can insert sessions"
  ON workout_sessions FOR INSERT WITH CHECK (true);
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
  exercises       JSONB,          -- [{ name, sets, reps, weight, volume }]
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
CREATE POLICY "Users can CRUD own PRs"
  ON personal_records FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. USER ROUTINES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_routines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  exercise_ids    JSONB NOT NULL,  -- ["swing-2h", "goblet-squat", ...]
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own routines"
  ON user_routines FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_days    JSONB DEFAULT '[]',  -- ["mon","wed","fri"]
  rest_days       JSONB DEFAULT '[]',
  deload          JSONB DEFAULT '{}',  -- { enabled, everyNWeeks }
  reminders       JSONB DEFAULT '{}',  -- { workout: { time }, weighIn: { time }, ... }
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own schedule"
  ON schedules FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 9. USER GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT,           -- strength / weight / consistency / custom
  target_value    NUMERIC,
  current_value   NUMERIC DEFAULT 0,
  unit            TEXT,
  deadline        DATE,
  status          TEXT DEFAULT 'active',  -- active / completed / archived
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
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

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 4. APIs & Services Required

### 4a. Supabase APIs (used by the app)

| API | Used For | How |
|-----|----------|-----|
| **Supabase Auth** | Sign up, sign in, sign out, session management, password reset, email verification | `@supabase/supabase-js` client — `supabase.auth.*` |
| **Supabase Database (PostgREST)** | CRUD on all tables (profiles, workouts, etc.) | `supabase.from('table').select/insert/update/delete()` |
| **Supabase Storage** | Profile photo uploads | `supabase.storage.from('profile-photos').upload()` |
| **Supabase Realtime** | Optional — live sync across tabs/devices | `supabase.channel().on('postgres_changes', ...)` |
| **Supabase Edge Functions** | Stripe checkout, webhook, billing portal | Deno functions deployed to Supabase |

### 4b. Third-Party APIs

| API | Used For | Env Variable | Where Set |
|-----|----------|-------------|-----------|
| **OpenAI TTS** | Coach voice (already exists) | `OPENAI_API_KEY` | Vercel env vars |
| **Stripe** (optional — Pro tier) | Payment processing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Supabase Edge Function secrets + Vercel env |
| **Supabase** | Auth + DB + Storage | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `.env` + Vercel env vars |

### 4c. NPM Packages Needed

```bash
# Already in the project (probably):
@supabase/supabase-js

# If not installed yet:
npm install @supabase/supabase-js
```

No other new packages are required for the Supabase integration. Stripe.js is loaded via `<script>` tag or `@stripe/stripe-js` if you add the Pro tier.

---

## 5. MCP Servers & Dev Tools

### What is an MCP?

MCP (Model Context Protocol) servers are tools that AI coding assistants like Cursor can use to interact with external services directly. For this project, the relevant MCPs are:

### 5a. Supabase MCP Server (Recommended for Cursor)

This lets Cursor directly query your Supabase database, run SQL, manage tables, and inspect schema without leaving the editor.

**Install in Cursor:**

Add to your Cursor MCP config (`.cursor/mcp.json` or via Settings → MCP Servers):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
      ]
    }
  }
}
```

**How to get your access token:**
1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Name it "Cursor MCP" and copy the token
4. Paste it in the config above

**What this MCP enables Cursor to do:**
- List and inspect all tables, columns, RLS policies
- Run SQL queries and migrations
- Create/alter tables
- Manage storage buckets
- Check Edge Function logs

### 5b. Vercel MCP Server (Optional)

For deployment management from Cursor:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "vercel-mcp-server"
      ],
      "env": {
        "VERCEL_API_TOKEN": "YOUR_VERCEL_TOKEN"
      }
    }
  }
}
```

Get your Vercel token at: https://vercel.com/account/tokens

### 5c. Supabase CLI (Optional — for Edge Functions)

Only needed if you deploy Stripe Edge Functions:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

---

---

# PART A — YOUR MANUAL STEPS (Supabase Dashboard)

> Do these steps in your browser at https://supabase.com/dashboard.  
> Each step tells you exactly what to click and what to paste.

---

## A1: Create a Supabase Project

> Skip if you already have a project for this app.

1. Go to **https://supabase.com/dashboard**
2. Click **New project**
3. Fill in:
   - **Name:** `kettlebell-gym` (or any name)
   - **Database Password:** Generate a strong password → **save this password somewhere safe** (you'll need it if you ever connect directly via Postgres)
   - **Region:** Choose the region closest to your users (e.g., `us-east-1` for US, `eu-west-1` for Europe)
4. Click **Create new project**
5. Wait 1–2 minutes for provisioning to complete

---

## A2: Run the Database Schema SQL

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. **Copy the ENTIRE SQL block from [Section 3: Database Schema Design](#3-database-schema-design)** above
4. Paste it into the SQL Editor
5. Click **Run** (or Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" — this means all tables were created

**Verify:**
1. Click **Table Editor** in the left sidebar
2. You should see these tables listed:
   - `profiles`
   - `subscriptions`
   - `workout_sessions`
   - `workout_history`
   - `body_metrics`
   - `personal_records`
   - `user_routines`
   - `schedules`
   - `user_goals`

---

## A3: Enable Auth Providers

1. In the left sidebar, click **Authentication**
2. Click **Providers** tab
3. **Email** (should be enabled by default):
   - Click on **Email**
   - Ensure **Enable Email provider** is ON
   - **Confirm email:** Toggle ON (recommended for production)
   - **Secure email change:** Toggle ON
   - Click **Save**
4. **Google OAuth** (optional but recommended):
   - Click on **Google**
   - Toggle **Enable Google provider** ON
   - You need a Google OAuth Client ID and Secret:
     1. Go to https://console.cloud.google.com/apis/credentials
     2. Create an OAuth 2.0 Client ID (Web application)
     3. Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     4. Copy the Client ID and Client Secret back into Supabase
   - Click **Save**

---

## A4: Configure Auth URLs & Redirects

1. In **Authentication** → **URL Configuration**
2. Set:
   - **Site URL:** `https://your-app.vercel.app` (your production Vercel URL)
   - **Redirect URLs** — add ALL of these (one per line):
     ```
     https://your-app.vercel.app/auth/callback
     https://your-app.vercel.app/payment/success
     https://your-app.vercel.app/payment/cancel
     http://localhost:5173/auth/callback
     http://localhost:5173/payment/success
     http://localhost:5173/payment/cancel
     ```
3. Click **Save**

> **Important:** Replace `your-app.vercel.app` with your actual Vercel domain.

---

## A5: Set Up Storage Buckets

1. In the left sidebar, click **Storage**
2. Click **New bucket**
3. Fill in:
   - **Name:** `profile-photos`
   - **Public:** Toggle **ON** (so photo URLs work without auth tokens in `<img>` tags)
   - **File size limit:** `5MB`
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
4. Click **Create bucket**
5. Click on the `profile-photos` bucket → **Policies** tab
6. Click **New Policy** → **For full customization**:
   - **Policy name:** `Users can upload own photos`
   - **Allowed operation:** INSERT
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:**
     ```sql
     (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1])
     ```
7. Add another policy:
   - **Policy name:** `Anyone can view photos`
   - **Allowed operation:** SELECT
   - **Target roles:** `public`
   - **USING expression:** `true`
8. Add another policy:
   - **Policy name:** `Users can update own photos`
   - **Allowed operation:** UPDATE
   - **Target roles:** `authenticated`
   - **USING expression:**
     ```sql
     (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1])
     ```

---

## A6: Copy Your API Keys

1. In the left sidebar, click **Project Settings** (gear icon at bottom)
2. Click **API** under Configuration
3. Copy these two values — you will need them for both `.env` and Vercel:

| Value | Where to find | What it looks like |
|-------|--------------|-------------------|
| **Project URL** | Under "Project URL" | `https://abcdefghijk.supabase.co` |
| **Anon/Public Key** | Under "Project API keys" → `anon` `public` | `eyJhbGciOiJIUzI1NiIs...` (long JWT) |
| **Service Role Key** | Under "Project API keys" → `service_role` `secret` | `eyJhbGciOiJIUzI1NiIs...` (⚠️ NEVER expose in frontend) |

> The **service_role** key is only used server-side (Vercel serverless functions, Supabase Edge Functions). Never put it in `VITE_` env vars.

---

## A7: Set Environment Variables in Vercel

1. Go to **https://vercel.com/dashboard**
2. Click on your **Kettlebell Gym** project
3. Click **Settings** → **Environment Variables**
4. Add these variables (for **Production**, **Preview**, and **Development**):

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_SUPABASE_URL` | `https://abcdefghijk.supabase.co` | From A6 |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | From A6 (anon key) |
| `OPENAI_API_KEY` | `sk-...` | Already set if TTS is working |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | From A6 — for serverless functions only |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Only if using Stripe Pro tier |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Only if using Stripe |
| `STRIPE_PRICE_ID` | `price_...` | Only if using Stripe |

5. Click **Save** for each
6. **Redeploy** your app: Go to **Deployments** tab → click the three dots on the latest → **Redeploy**

---

## A8: Deploy Edge Functions (Stripe — optional)

> Only needed if you are implementing the Pro subscription tier with Stripe.

1. Install Supabase CLI locally:
   ```bash
   npm install -g supabase
   ```
2. Link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project ref in Supabase → Settings → General)

3. Set Stripe secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   supabase secrets set STRIPE_PRICE_ID=price_...
   ```

4. Edge Functions will be created in step B11 — come back here to deploy them:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   supabase functions deploy create-portal-session
   ```

---

---

# PART B — CURSOR CODE CHANGES

> These are step-by-step instructions for Cursor to implement in the codebase.  
> Each step includes the exact file path, what to create or change, and the full code.

---

## B1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

If implementing Stripe Pro tier:
```bash
npm install @stripe/stripe-js
```

---

## B2: Create / Update .env and .env.example

**File: `.env.example`** — update to:

```env
# Supabase (required for auth + database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI TTS (optional — coach voice)
OPENAI_API_KEY=sk-...

# Stripe (optional — Pro subscription)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**File: `.env`** — create from `.env.example` and fill in real values:

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## B3: Update src/lib/supabase.js — Supabase Client

Replace the existing `src/lib/supabase.js` with:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars missing. Auth and cloud sync disabled. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,   // handles /auth/callback redirects
      },
    })
  : null;

/**
 * Helper: returns true if Supabase is configured and available
 */
export const isSupabaseAvailable = () => !!supabase;
```

---

## B4: Create src/contexts/AuthContext.jsx

```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  subscription: null,
  loading: true,
  isPro: false,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

  // Fetch profile + subscription from DB
  const fetchUserData = async (userId) => {
    if (!supabase || !userId) return;

    const [{ data: profileData }, { data: subData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
    ]);

    if (profileData) setProfile(profileData);
    if (subData) setSubscription(subData);
  };

  useEffect(() => {
    if (!isSupabaseAvailable()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchUserData(s.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchUserData(s.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      }
    );

    return () => authSub.unsubscribe();
  }, []);

  // Auth methods
  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    return { error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    return { data, error };
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, subscription, loading, isPro,
      signUp, signIn, signInWithGoogle, signOut, resetPassword, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## B5: Update src/main.jsx — Wrap with AuthProvider

```javascript
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

---

## B6: Create Auth Components

### B6a: src/components/auth/SignInModal.jsx

```javascript
// src/components/auth/SignInModal.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthModal.module.css';

export default function SignInModal({ onClose, onSwitchToRegister }) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message);
    else onClose();
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Sign In</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <button className={styles.google} onClick={signInWithGoogle}>
          Continue with Google
        </button>
        <p className={styles.switch}>
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister}>Register</button>
        </p>
      </div>
    </div>
  );
}
```

### B6b: src/components/auth/RegisterModal.jsx

```javascript
// src/components/auth/RegisterModal.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthModal.module.css';

export default function RegisterModal({ onClose, onSwitchToSignIn }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signUp(email, password, name);
    if (err) setError(err.message);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2>Check your email</h2>
          <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Create Account</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Display Name" value={name}
            onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 6 chars)" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className={styles.switch}>
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn}>Sign In</button>
        </p>
      </div>
    </div>
  );
}
```

### B6c: src/components/auth/AuthCallback.jsx

```javascript
// src/components/auth/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the token exchange automatically via detectSessionInUrl
    // Just wait a moment then redirect home
    const timer = setTimeout(() => navigate('/', { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p>Verifying your account…</p>
    </div>
  );
}
```

### B6d: src/components/auth/AuthModal.module.css

```css
/* src/components/auth/AuthModal.module.css */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff; border-radius: 16px; padding: 2rem;
  max-width: 380px; width: 90%; max-height: 90vh; overflow-y: auto;
}
.modal h2 { margin: 0 0 1rem; text-align: center; }
.modal form { display: flex; flex-direction: column; gap: 0.75rem; }
.modal input {
  padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;
  font-size: 1rem;
}
.modal button[type="submit"], .google {
  padding: 0.75rem; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
  background: #f97316; color: #fff;
}
.modal button[type="submit"]:disabled { opacity: 0.6; }
.google { background: #4285f4; margin-top: 0.5rem; width: 100%; }
.error { color: #dc2626; font-size: 0.875rem; text-align: center; }
.switch { text-align: center; font-size: 0.875rem; margin-top: 1rem; }
.switch button {
  background: none; border: none; color: #f97316;
  cursor: pointer; font-weight: 600; font-size: 0.875rem;
}
```

---

## B7: Create / Update Service Layer — Sync localStorage to Supabase

Create a new sync service that acts as the bridge between localStorage and Supabase:

### src/services/syncService.js

```javascript
// src/services/syncService.js
// Dual-write: saves to both localStorage and Supabase (when authenticated)
import { supabase, isSupabaseAvailable } from '../lib/supabase';

/**
 * Get the current authenticated user ID, or null
 */
const getUserId = async () => {
  if (!isSupabaseAvailable()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

// ── PROFILE ──────────────────────────────────────────────────
export const syncProfileToSupabase = async (profileData) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: profileData.name,
      age: profileData.age,
      gender: profileData.gender,
      weight: profileData.weight,
      height: profileData.height,
      target_weight: profileData.targetWeight,
      body_measurements: profileData.bodyMeasurements || {},
      fitness_level: profileData.fitnessLevel,
      experience: profileData.experience,
      injuries: profileData.injuries,
      equipment: profileData.equipment || {},
      goals: profileData.goals || {},
      coach_voice: profileData.coachVoice || 'female',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) console.error('Sync profile error:', error);
};

// ── WORKOUTS (manual logs) ───────────────────────────────────
export const syncWorkoutToSupabase = async (workout) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('workout_history').insert({
    user_id: userId,
    date: workout.date,
    time: workout.time,
    planned_min: workout.plannedMin,
    actual_min: workout.actualMin,
    exercises: workout.exercises || [],
    total_volume: workout.totalVolume,
    rpe: workout.rpe,
    energy: workout.energy,
    modifications: workout.modifications,
    skipped: workout.skipped,
    prs: workout.prs,
    notes: workout.notes,
  });

  if (error) console.error('Sync workout error:', error);
};

// ── BODY METRICS ─────────────────────────────────────────────
export const syncBodyMetricToSupabase = async (metric) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('body_metrics').insert({
    user_id: userId,
    date: metric.date,
    weight: metric.weight,
    body_fat: metric.bodyFat,
    chest: metric.chest,
    waist: metric.waist,
    hips: metric.hips,
    bicep: metric.bicep,
    thigh: metric.thigh,
    notes: metric.notes,
  });

  if (error) console.error('Sync body metric error:', error);
};

// ── PERSONAL RECORDS ─────────────────────────────────────────
export const syncPRToSupabase = async (pr) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('personal_records').insert({
    user_id: userId,
    exercise_id: pr.exerciseId,
    exercise_name: pr.exerciseName,
    weight: pr.weight,
    reps: pr.reps,
    volume: pr.volume,
    date: pr.date,
    notes: pr.notes,
  });

  if (error) console.error('Sync PR error:', error);
};

// ── SCHEDULE ─────────────────────────────────────────────────
export const syncScheduleToSupabase = async (schedule) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('schedules').upsert({
    user_id: userId,
    workout_days: schedule.workoutDays || [],
    rest_days: schedule.restDays || [],
    deload: schedule.deload || {},
    reminders: schedule.reminders || {},
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) console.error('Sync schedule error:', error);
};

// ── USER ROUTINES ────────────────────────────────────────────
export const syncRoutineToSupabase = async (routine) => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('user_routines').insert({
    user_id: userId,
    name: routine.name,
    exercise_ids: routine.exerciseIds,
  });

  if (error) console.error('Sync routine error:', error);
};

export const deleteRoutineFromSupabase = async (routineId) => {
  const userId = await getUserId();
  if (!userId) return;

  // The routine ID in IndexedDB may differ from Supabase; match by name if needed
  const { error } = await supabase.from('user_routines')
    .delete()
    .eq('user_id', userId)
    .eq('id', routineId);

  if (error) console.error('Delete routine error:', error);
};

// ── BULK IMPORT (one-time migration from localStorage to Supabase) ──
export const migrateLocalDataToSupabase = async () => {
  const userId = await getUserId();
  if (!userId) return;

  // Profile
  const profileRaw = localStorage.getItem('kettlebell-profile');
  if (profileRaw) {
    try { await syncProfileToSupabase(JSON.parse(profileRaw)); }
    catch (e) { console.error('Migrate profile:', e); }
  }

  // Workouts
  const workoutsRaw = localStorage.getItem('kettlebell-workouts');
  if (workoutsRaw) {
    try {
      const workouts = JSON.parse(workoutsRaw);
      for (const w of workouts) await syncWorkoutToSupabase(w);
    } catch (e) { console.error('Migrate workouts:', e); }
  }

  // Body metrics
  const metricsRaw = localStorage.getItem('kettlebell-body-metrics');
  if (metricsRaw) {
    try {
      const metrics = JSON.parse(metricsRaw);
      for (const m of metrics) await syncBodyMetricToSupabase(m);
    } catch (e) { console.error('Migrate metrics:', e); }
  }

  // PRs
  const prsRaw = localStorage.getItem('kettlebell-prs');
  if (prsRaw) {
    try {
      const prs = JSON.parse(prsRaw);
      for (const p of prs) await syncPRToSupabase(p);
    } catch (e) { console.error('Migrate PRs:', e); }
  }

  // Schedule
  const scheduleRaw = localStorage.getItem('kettlebell-schedule');
  if (scheduleRaw) {
    try { await syncScheduleToSupabase(JSON.parse(scheduleRaw)); }
    catch (e) { console.error('Migrate schedule:', e); }
  }

  // Mark migration done
  localStorage.setItem('kettlebell-supabase-migrated', 'true');
};
```

---

## B8: Update Existing Storage Libs — Dual Write

For each existing storage lib, add a Supabase sync call after the localStorage write. Here's the pattern — apply to each file:

### Example: src/lib/trackingStorage.js (add sync calls)

At the top of the file, add:
```javascript
import { syncWorkoutToSupabase, syncBodyMetricToSupabase, syncPRToSupabase } from '../services/syncService';
```

Then, in each `save` function, add the sync call after the localStorage write:

```javascript
// In saveWorkout(workout):
// ... existing localStorage save code ...
syncWorkoutToSupabase(workout).catch(console.error); // fire-and-forget

// In saveBodyMetric(metric):
// ... existing localStorage save code ...
syncBodyMetricToSupabase(metric).catch(console.error);

// In savePR(pr):
// ... existing localStorage save code ...
syncPRToSupabase(pr).catch(console.error);
```

### Same pattern for:

- **`src/lib/profileStorage.js`** → after saving profile, call `syncProfileToSupabase(profile)`
- **`src/lib/scheduleStorage.js`** → after saving schedule, call `syncScheduleToSupabase(schedule)`
- **`src/lib/routineDatabase.js`** → after `saveRoutine`, call `syncRoutineToSupabase(routine)`; after `deleteRoutine`, call `deleteRoutineFromSupabase(id)`

> **Important:** The localStorage write remains the primary source. Supabase sync is fire-and-forget. This means the app still works offline and with no Supabase connection.

---

## B9: Create Profile Photo Upload Service

### src/services/photoService.js

```javascript
// src/services/photoService.js
import { supabase, isSupabaseAvailable } from '../lib/supabase';

/**
 * Upload profile photo to Supabase Storage
 * Returns the public URL, or null on error
 */
export async function uploadProfilePhoto(file) {
  if (!isSupabaseAvailable()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Photo upload error:', uploadError);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  // Save URL to profile
  await supabase.from('profiles')
    .update({ photo_url: publicUrl })
    .eq('id', user.id);

  return publicUrl;
}
```

---

## B10: Create Pro Subscription Gate Components

### src/components/auth/ProGate.jsx

```javascript
// src/components/auth/ProGate.jsx
// Wraps content that requires Pro subscription
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProGate.module.css';

export default function ProGate({ children, fallback }) {
  const { user, isPro, loading } = useAuth();

  if (loading) return <div className={styles.loading}>Loading…</div>;

  // Not logged in
  if (!user) {
    return fallback || (
      <div className={styles.gate}>
        <p>Sign in to access this feature.</p>
      </div>
    );
  }

  // Logged in but not Pro
  if (!isPro) {
    return fallback || (
      <div className={styles.gate}>
        <h3>🔒 Pro Feature</h3>
        <p>Upgrade to Pro to unlock this feature.</p>
      </div>
    );
  }

  return children;
}
```

---

## B11: Add Vercel Serverless Functions for Stripe

> Only needed if implementing Pro tier. Create these files in the `api/` directory at project root.

### api/create-checkout-session.js

```javascript
// api/create-checkout-session.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, email } = req.body;

  try {
    // Get or create Stripe customer
    let customerId;
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
      }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
```

### api/stripe-webhook.js

```javascript
// api/stripe-webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const sub = event.data.object;

  if (event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated') {
    await supabase.from('subscriptions').update({
      stripe_subscription_id: sub.id,
      plan: 'pro',
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('stripe_customer_id', sub.customer);
  }

  if (event.type === 'customer.subscription.deleted') {
    await supabase.from('subscriptions').update({
      plan: 'free',
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('stripe_customer_id', sub.customer);
  }

  res.json({ received: true });
}
```

---

## B12: Update vite.config.js

Ensure the existing config doesn't conflict. No changes needed for Supabase specifically — the `@supabase/supabase-js` client talks directly to the Supabase URL. The existing `/api` proxy for TTS stays as-is.

---

## B13: Update Vercel Environment Variables

Ensure all of these are set (see Part A, step A7). The `VITE_` prefixed ones must be available at **build time**:

```
VITE_SUPABASE_URL          → build time (frontend)
VITE_SUPABASE_ANON_KEY     → build time (frontend)
SUPABASE_SERVICE_ROLE_KEY  → runtime only (serverless functions)
OPENAI_API_KEY             → runtime only (TTS edge function)
STRIPE_SECRET_KEY          → runtime only (serverless)
STRIPE_WEBHOOK_SECRET      → runtime only (serverless)
STRIPE_PRICE_ID            → runtime only (serverless)
VITE_STRIPE_PUBLISHABLE_KEY → build time (frontend, if using Stripe.js)
```

After adding/changing env vars, **redeploy** the app on Vercel.

---

## B14: Test Checklist

After implementing all steps, verify:

### Auth
- [ ] Sign up with email/password → check email → confirm → logged in
- [ ] Sign in with email/password → home shows user name
- [ ] Sign out → auth state clears
- [ ] Google OAuth (if enabled) → redirects correctly
- [ ] Auth callback page handles redirect from email link
- [ ] Password reset email sends and works

### Data Sync
- [ ] Save a workout log → appears in `workout_history` table in Supabase
- [ ] Log body metrics → appears in `body_metrics` table
- [ ] Save a PR → appears in `personal_records` table
- [ ] Update profile → `profiles` row updates
- [ ] Save schedule → `schedules` row upserts
- [ ] Save user routine → `user_routines` row created
- [ ] Delete user routine → `user_routines` row deleted
- [ ] Complete a timer session → `workout_sessions` row created (existing feature)

### Offline / No Auth
- [ ] App works without Supabase env vars (localStorage only)
- [ ] App works when not signed in (localStorage only)
- [ ] No console errors about missing Supabase when env vars aren't set

### Storage
- [ ] Upload profile photo → file appears in `profile-photos` bucket
- [ ] Photo URL is saved to `profiles.photo_url`
- [ ] Photo displays in app UI

### Pro Gate (if Stripe implemented)
- [ ] Free user sees lock icons on Pro features
- [ ] Pro user can access gated features
- [ ] Stripe checkout creates subscription
- [ ] Webhook updates subscription status

### Deployment
- [ ] `npm run build` succeeds
- [ ] Vercel deployment picks up all env vars
- [ ] Production app connects to Supabase correctly
- [ ] TTS still works (separate from Supabase)

---

## Quick Reference: File Changes Summary

| Action | File | Change |
|--------|------|--------|
| Install | `package.json` | `@supabase/supabase-js` added |
| Update | `.env.example` | Add Supabase + Stripe vars |
| Create | `.env` | Real values |
| Replace | `src/lib/supabase.js` | Full client with auth config |
| Create | `src/contexts/AuthContext.jsx` | Auth context + provider |
| Update | `src/main.jsx` | Wrap with `AuthProvider` |
| Create | `src/components/auth/SignInModal.jsx` | Sign in UI |
| Create | `src/components/auth/RegisterModal.jsx` | Registration UI |
| Create | `src/components/auth/AuthCallback.jsx` | Email verify handler |
| Create | `src/components/auth/AuthModal.module.css` | Auth modal styles |
| Create | `src/services/syncService.js` | Dual-write sync layer |
| Update | `src/lib/trackingStorage.js` | Add sync imports + calls |
| Update | `src/lib/profileStorage.js` | Add sync import + call |
| Update | `src/lib/scheduleStorage.js` | Add sync import + call |
| Update | `src/lib/routineDatabase.js` | Add sync import + calls |
| Create | `src/services/photoService.js` | Profile photo upload |
| Create | `src/components/auth/ProGate.jsx` | Subscription gate |
| Create | `api/create-checkout-session.js` | Stripe checkout (optional) |
| Create | `api/stripe-webhook.js` | Stripe webhook (optional) |

---

## Implementation Order (Recommended)

1. **Phase 1 — Supabase + Auth** (do this first)
   - Steps A1–A7 (Supabase project, schema, auth, keys, Vercel env)
   - Steps B1–B6 (install, env, client, auth context, auth components)

2. **Phase 2 — Data Sync**
   - Steps B7–B8 (sync service, dual-write in storage libs)

3. **Phase 3 — Storage & Photos**
   - Steps A5, B9 (storage bucket, photo upload service)

4. **Phase 4 — Pro Tier** (optional, do last)
   - Steps A8, B10–B11 (Edge Functions, ProGate, Stripe serverless)

---

*End of guide. Keep this file in the project root as `SUPABASE_SETUP_GUIDE.md`.*


