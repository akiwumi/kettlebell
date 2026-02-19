# Kettlebell Mastery — Updated Application Architecture (Pro Subscription Model)

This document extends the original `STRUCTURE_README.md` with a full subscription payment system (Stripe), Supabase auth + data, tiered access control, email-verified registration, and AI assistant integration for Pro users. It is the implementation blueprint for upgrading the app from a free-only model to a freemium Pro model.

---

## Table of Contents

1. [Subscription Model Overview](#1-subscription-model-overview)
2. [User Tiers & Access Matrix](#2-user-tiers--access-matrix)
3. [Registration & Authentication Flow](#3-registration--authentication-flow)
4. [Supabase Database Schema](#4-supabase-database-schema)
5. [Stripe Payment Integration](#5-stripe-payment-integration)
6. [Home Page Pro Banner & UX](#6-home-page-pro-banner--ux)
7. [Paywall Gate Logic](#7-paywall-gate-logic)
8. [AI Assistant Integration (Pro Only)](#8-ai-assistant-integration-pro-only)
9. [Analytics & Tracking (Pro Only)](#9-analytics--tracking-pro-only)
10. [Updated Routes & Components](#10-updated-routes--components)
11. [Updated File Tree](#11-updated-file-tree)
12. [Environment Variables](#12-environment-variables)
13. [Migration Checklist](#13-migration-checklist)
14. [Implementation Order](#14-implementation-order)

---

## 1. Subscription Model Overview

```
┌──────────────────────────────────────────────────────────┐
│                    KETTLEBELL MASTERY                     │
│                                                          │
│   ┌────────────────────┐    ┌─────────────────────────┐  │
│   │    FREE USER       │    │      PRO USER (€3/mo)   │  │
│   │                    │    │                          │  │
│   │ • View app curated │    │ • Everything in Free     │  │
│   │   exercise routines│    │ • Create workout plans   │  │
│   │ • Exercise library │    │ • Custom routines        │  │
│   │   (browse only)    │    │ • Full analytics suite   │  │
│   │ • Basic profile    │    │ • All trackers & charts  │  │
│   │   (name, photo,    │    │ • Goal setting           │  │
│   │    email)          │    │ • AI Assistant access    │  │
│   │ • View Pro feature │    │ • Schedule & reminders   │  │
│   │   previews (locked)│    │ • Body metrics tracking  │  │
│   │                    │    │ • Performance metrics    │  │
│   │                    │    │ • Workout history/logs   │  │
│   │                    │    │ • Share with friends     │  │
│   │                    │    │ • Full profile fields    │  │
│   └────────────────────┘    └─────────────────────────┘  │
│                                                          │
│   Payment: Stripe Checkout → €3/month recurring          │
│   Data:    Supabase (auth + all user data)               │
│   Auth:    Email + password + email verification          │
└──────────────────────────────────────────────────────────┘
```

| Aspect | Detail |
|--------|--------|
| **Price** | €3 per month, recurring |
| **Payment** | Stripe Checkout (hosted page) |
| **Currency** | EUR |
| **Billing** | Monthly auto-renewal via Stripe |
| **Cancellation** | User can cancel anytime; access continues until period end |
| **Trial** | None (immediate access on payment) |
| **Data store** | Supabase (Postgres + Auth + Storage) |
| **Auth** | Supabase Auth with email + password + email verification |

---

## 2. User Tiers & Access Matrix

### Access Control Table

| Feature / Area | No Account | Free (Registered) | Pro (€3/mo) |
|---|---|---|---|
| Landing page | ✅ | ✅ | ✅ |
| Exercise library (browse) | ✅ | ✅ | ✅ |
| View curated routines (read-only) | ✅ | ✅ | ✅ |
| View Pro feature previews (locked) | ✅ | ✅ | ✅ |
| **Start a curated exercise routine** | ❌ (triggers registration) | ✅ | ✅ |
| Profile: name, photo, email | ❌ | ✅ | ✅ |
| Profile: age, goals, equipment, coach voice | ❌ | 🔒 Visible but locked | ✅ |
| Create custom workout plans | ❌ | 🔒 Visible but locked | ✅ |
| "Build your own" routines | ❌ | 🔒 Visible but locked | ✅ |
| Save user-created routines | ❌ | 🔒 Visible but locked | ✅ |
| "My Routines" tab (use saved routines) | ❌ | 🔒 Visible but locked | ✅ |
| Analytics dashboard | ❌ | 🔒 Visible but locked | ✅ |
| Progress charts & graphs | ❌ | 🔒 Visible but locked | ✅ |
| Workout log & history | ❌ | 🔒 Visible but locked | ✅ |
| Body metrics tracking | ❌ | 🔒 Visible but locked | ✅ |
| Performance metrics & PRs | ❌ | 🔒 Visible but locked | ✅ |
| Weekly/monthly stats | ❌ | 🔒 Visible but locked | ✅ |
| Schedule & reminders | ❌ | 🔒 Visible but locked | ✅ |
| Goal setting & tracking | ❌ | 🔒 Visible but locked | ✅ |
| AI Assistant | ❌ | 🔒 Visible but locked | ✅ |
| Share with friends | ❌ | 🔒 Visible but locked | ✅ |
| Community features | ❌ | 🔒 Visible but locked | ✅ |

### Key Access Rules

- **No account users** can browse the app freely. When they tap "Start" on any exercise routine, the registration modal appears.
- **Free registered users** can use the app-curated exercise routines. They can see all Pro features in the UI (greyed out or with a lock icon and "Go Pro" badge), but cannot interact with them.
- **Pro users** have full unrestricted access to everything.

---

## 3. Registration & Authentication Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION & AUTH FLOW                      │
│                                                                  │
│  User opens app                                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────┐                                                     │
│  │ Landing │  →  Tap  →  Home (browsing mode, no account)        │
│  └─────────┘                                                     │
│       │                                                          │
│       │  User can browse library, view routines, see previews    │
│       │                                                          │
│       ▼                                                          │
│  User taps "Start" on any exercise routine                       │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────┐                                    │
│  │  REGISTRATION MODAL      │                                    │
│  │                          │                                    │
│  │  • Full name             │                                    │
│  │  • Email address         │                                    │
│  │  • Password              │                                    │
│  │  • Confirm password      │                                    │
│  │  • Profile picture       │                                    │
│  │    (optional, upload)    │                                    │
│  │                          │                                    │
│  │  [Create Account]        │                                    │
│  │                          │                                    │
│  │  Already have an account?│                                    │
│  │  [Sign In]               │                                    │
│  └──────────────────────────┘                                    │
│       │                                                          │
│       ▼                                                          │
│  Supabase Auth: signUp(email, password, { name, photo })         │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────┐                                    │
│  │  EMAIL VERIFICATION      │                                    │
│  │  SCREEN                  │                                    │
│  │                          │                                    │
│  │  "Check your email!      │                                    │
│  │   We sent a verification │                                    │
│  │   link to you@email.com" │                                    │
│  │                          │                                    │
│  │  [Resend Email]          │                                    │
│  │  [Change Email]          │                                    │
│  └──────────────────────────┘                                    │
│       │                                                          │
│       ▼  (user clicks link in email)                             │
│                                                                  │
│  Supabase confirms email → user redirected back to app           │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────┐                                    │
│  │  WELCOME SCREEN          │                                    │
│  │                          │                                    │
│  │  "Welcome, [Name]! 🎉"  │                                    │
│  │                          │                                    │
│  │  Your free account is    │                                    │
│  │  ready. Start a curated  │                                    │
│  │  routine now!            │                                    │
│  │                          │                                    │
│  │  ┌────────────────────┐  │                                    │
│  │  │ 🚀 Go Pro for €3/mo│  │                                    │
│  │  │ Unlock ALL features │  │                                    │
│  │  └────────────────────┘  │                                    │
│  │                          │                                    │
│  │  [Continue to App]       │                                    │
│  └──────────────────────────┘                                    │
│       │                                                          │
│       ▼                                                          │
│  Home (logged in as Free user)                                   │
│  Registration data saved to Profile                              │
└──────────────────────────────────────────────────────────────────┘
```

### Sign-In Flow (Returning Users)

```
┌──────────────────────────┐
│  SIGN IN MODAL           │
│                          │
│  • Email address         │
│  • Password              │
│                          │
│  [Sign In]               │
│                          │
│  [Forgot Password?]      │
│  → Supabase password     │
│    reset email flow      │
│                          │
│  Don't have an account?  │
│  [Create Account]        │
└──────────────────────────┘
```

### Implementation: Supabase Auth

| File | Purpose |
|------|---------|
| `src/lib/supabaseClient.js` | Initialize Supabase client (replaces old `supabase.js`) |
| `src/contexts/AuthContext.jsx` | React context: `user`, `session`, `isPro`, `loading`, `signUp`, `signIn`, `signOut`, `resetPassword` |
| `src/components/auth/RegisterModal.jsx` | Registration form modal (name, email, password, photo) |
| `src/components/auth/SignInModal.jsx` | Sign-in form modal |
| `src/components/auth/EmailVerification.jsx` | "Check your email" screen |
| `src/components/auth/ForgotPassword.jsx` | Password reset request form |
| `src/components/auth/AuthGate.jsx` | Wrapper: if not logged in and tries to start routine → show RegisterModal |

### Supabase Auth Configuration

In Supabase dashboard:
1. Enable email auth provider
2. Enable email confirmations (Settings → Auth → Email → "Enable email confirmations")
3. Customize email templates (confirmation, password reset)
4. Set redirect URL to your app domain (e.g., `https://yourdomain.com/auth/callback`)
5. Set minimum password length (8 characters recommended)

### Auth Context Implementation Notes

```
AuthContext provides:
├── user              → Supabase user object (null if not logged in)
├── session           → Supabase session (null if not logged in)
├── profile           → User profile from profiles table
├── isPro             → Boolean: does user have active subscription?
├── isEmailVerified   → Boolean: has user verified their email?
├── loading           → Boolean: auth state loading
├── signUp(email, password, metadata)
├── signIn(email, password)
├── signOut()
├── resetPassword(email)
└── updateProfile(data)
```

---

## 4. Supabase Database Schema

### Tables Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                            │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────┐                       │
│  │  auth.users   │────▶│    profiles       │                      │
│  │  (built-in)   │     │                  │                       │
│  └──────────────┘     │  id (FK users)   │                       │
│                        │  full_name       │                       │
│                        │  email           │                       │
│                        │  avatar_url      │                       │
│                        │  age             │                       │
│                        │  goals           │                       │
│                        │  equipment       │                       │
│                        │  coach_voice     │                       │
│                        │  is_pro          │                       │
│                        │  created_at      │                       │
│                        │  updated_at      │                       │
│                        └──────────────────┘                       │
│                              │                                    │
│         ┌────────────────────┼─────────────────────┐              │
│         │                    │                     │              │
│         ▼                    ▼                     ▼              │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐     │
│  │ subscriptions │  │ workout_sessions│  │ user_routines    │     │
│  │              │  │                 │  │                  │     │
│  │ id           │  │ id              │  │ id               │     │
│  │ user_id (FK) │  │ user_id (FK)    │  │ user_id (FK)     │     │
│  │ stripe_cust  │  │ date            │  │ name             │     │
│  │ stripe_sub   │  │ duration_sec    │  │ exercise_ids     │     │
│  │ status       │  │ exercises       │  │ created_at       │     │
│  │ current_start│  │ rounds          │  └──────────────────┘     │
│  │ current_end  │  │ rpe             │                           │
│  │ cancel_at_end│  │ energy          │  ┌──────────────────┐     │
│  │ created_at   │  │ notes           │  │ body_metrics     │     │
│  │ updated_at   │  │ created_at      │  │                  │     │
│  └──────────────┘  └─────────────────┘  │ id               │     │
│                                          │ user_id (FK)     │     │
│  ┌──────────────────┐                    │ date             │     │
│  │ personal_records  │                    │ weight           │     │
│  │                  │                    │ body_fat         │     │
│  │ id               │                    │ measurements     │     │
│  │ user_id (FK)     │                    │ created_at       │     │
│  │ exercise_id      │                    └──────────────────┘     │
│  │ metric           │                                             │
│  │ value            │   ┌──────────────────┐                      │
│  │ date             │   │ schedules        │                      │
│  │ created_at       │   │                  │                      │
│  └──────────────────┘   │ id               │                      │
│                          │ user_id (FK)     │                      │
│  ┌──────────────────┐   │ workout_days     │                      │
│  │ user_goals       │   │ rest_days        │                      │
│  │                  │   │ deload_week      │                      │
│  │ id               │   │ reminders        │                      │
│  │ user_id (FK)     │   │ created_at       │                      │
│  │ goal_type        │   └──────────────────┘                      │
│  │ target_value     │                                             │
│  │ current_value    │                                             │
│  │ deadline         │                                             │
│  │ status           │                                             │
│  │ created_at       │                                             │
│  └──────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

### SQL Schema

```sql
-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,             -- URL in Supabase Storage or base64
  age INTEGER,                 -- Pro only field
  goals JSONB DEFAULT '[]',    -- Pro only field
  equipment JSONB DEFAULT '[]',-- Pro only field
  coach_voice TEXT DEFAULT 'off' CHECK (coach_voice IN ('off', 'female', 'male')),
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SUBSCRIPTIONS (Stripe sync)
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'trialing', 'unpaid', 'paused'
  )),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);

-- ============================================================
-- WORKOUT SESSIONS (expanded from original)
-- ============================================================
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER,
  exercises JSONB NOT NULL DEFAULT '[]',  -- [{id, name, reps, sets}]
  rounds INTEGER,
  work_seconds INTEGER,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  energy TEXT CHECK (energy IN ('low', 'medium', 'high')),
  notes TEXT,
  routine_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_date ON public.workout_sessions(user_id, date);

-- ============================================================
-- USER ROUTINES (Pro only — migrated from IndexedDB)
-- ============================================================
CREATE TABLE public.user_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercise_ids JSONB NOT NULL DEFAULT '[]',  -- ["swing-2h", "goblet-squat", ...]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routines_user ON public.user_routines(user_id);

-- ============================================================
-- BODY METRICS (Pro only)
-- ============================================================
CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(4,1),
  measurements JSONB DEFAULT '{}',  -- {chest, waist, hips, arms, thighs}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_body_user_date ON public.body_metrics(user_id, date);

-- ============================================================
-- PERSONAL RECORDS (Pro only)
-- ============================================================
CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  metric TEXT NOT NULL,         -- 'weight', 'reps', 'time'
  value DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prs_user_exercise ON public.personal_records(user_id, exercise_id);

-- ============================================================
-- SCHEDULES (Pro only)
-- ============================================================
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_days JSONB DEFAULT '[]',   -- [1,3,5] (Mon, Wed, Fri)
  rest_days JSONB DEFAULT '[]',
  deload_week INTEGER,               -- every N weeks
  reminders JSONB DEFAULT '{}',      -- {workout: true, weighIn: true, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER GOALS (Pro only)
-- ============================================================
CREATE TABLE public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,          -- 'workouts_per_week', 'weight_target', 'strength', 'consistency'
  title TEXT NOT NULL,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT,                        -- 'kg', 'sessions', '%', etc
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user ON public.user_goals(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own sessions" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own routines" ON public.user_routines
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own body metrics" ON public.body_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own PRs" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own schedule" ON public.schedules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

-- Service role policy for Stripe webhook to update subscriptions
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);
-- Note: restrict this to service_role in Supabase dashboard
```

### Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile photos | Public read, authenticated write (own folder) |

```sql
-- Storage policy: users can upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

---

## 5. Stripe Payment Integration

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                  STRIPE PAYMENT FLOW                            │
│                                                                 │
│  FRONTEND (React App)                 BACKEND (Supabase Edge)   │
│                                                                 │
│  ┌─────────────────────┐                                        │
│  │ User taps "Go Pro"  │                                        │
│  │ on Home banner or   │                                        │
│  │ any locked feature  │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐    ┌──────────────────────────┐        │
│  │ Call Supabase Edge   │───▶│ create-checkout-session   │       │
│  │ Function             │    │                          │       │
│  │                      │    │ • Creates Stripe Customer│       │
│  │                      │    │   (if not exists)        │       │
│  │                      │    │ • Creates Checkout       │       │
│  │                      │    │   Session (€3/mo)        │       │
│  │                      │◀───│ • Returns session URL    │       │
│  └──────────┬──────────┘    └──────────────────────────┘        │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                        │
│  │ Redirect to Stripe  │                                        │
│  │ Checkout page       │                                        │
│  │ (hosted by Stripe)  │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                   │
│             ▼  (user pays)                                      │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────┐        │
│  │ Redirect to          │    │ stripe-webhook            │       │
│  │ /payment/success     │    │                          │       │
│  │                      │    │ Stripe sends webhook:    │       │
│  │ App checks sub       │    │ • checkout.completed     │       │
│  │ status from          │    │ • invoice.paid           │       │
│  │ Supabase             │    │ • invoice.payment_failed │       │
│  │                      │    │ • customer.sub.updated   │       │
│  │ If active →          │    │ • customer.sub.deleted   │       │
│  │ isPro = true         │    │                          │       │
│  │                      │    │ → Updates subscriptions  │       │
│  │ Full access granted  │    │   table in Supabase      │       │
│  └─────────────────────┘    │ → Updates profiles.is_pro│       │
│                              └──────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────┐        │
│  │ Manage Subscription  │───▶│ create-portal-session     │       │
│  │ (in Profile page)   │    │                          │       │
│  │                      │◀───│ Returns Stripe Billing   │       │
│  │ → Opens Stripe       │    │ Portal URL              │       │
│  │   Billing Portal     │    └──────────────────────────┘        │
│  └─────────────────────┘                                        │
└────────────────────────────────────────────────────────────────┘
```

### Supabase Edge Functions

You need three Edge Functions deployed to Supabase:

#### 1. `create-checkout-session`

| Detail | Value |
|--------|-------|
| **Trigger** | Called from frontend when user taps "Go Pro" |
| **Input** | `user_id`, `email` (from auth context) |
| **Action** | Create Stripe Customer (if needed) → Create Checkout Session |
| **Output** | `{ url: "https://checkout.stripe.com/..." }` |

```
File: supabase/functions/create-checkout-session/index.ts

Logic:
1. Verify Supabase JWT from Authorization header
2. Get user_id from JWT
3. Check if stripe_customer_id already exists in subscriptions table
4. If not, call stripe.customers.create({ email, metadata: { user_id } })
5. Create checkout session:
   stripe.checkout.sessions.create({
     customer: stripeCustomerId,
     mode: 'subscription',
     line_items: [{
       price: STRIPE_PRICE_ID,  // €3/mo price created in Stripe dashboard
       quantity: 1
     }],
     success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${APP_URL}/payment/cancel`,
     metadata: { user_id }
   })
6. Return { url: session.url }
```

#### 2. `stripe-webhook`

| Detail | Value |
|--------|-------|
| **Trigger** | Stripe webhook POST |
| **Events** | `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| **Action** | Update `subscriptions` table and `profiles.is_pro` |

```
File: supabase/functions/stripe-webhook/index.ts

Logic:
1. Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
2. Parse event type:

   checkout.session.completed:
     → Extract user_id from metadata
     → Extract subscription ID from session
     → Retrieve full subscription from Stripe
     → INSERT into subscriptions table
     → UPDATE profiles SET is_pro = TRUE

   invoice.paid:
     → Subscription is active, update current_period_start/end
     → Ensure is_pro = TRUE

   invoice.payment_failed:
     → UPDATE subscription status = 'past_due'
     → Optionally keep is_pro = TRUE for grace period

   customer.subscription.updated:
     → UPDATE subscription status, cancel_at_period_end, period dates

   customer.subscription.deleted:
     → UPDATE subscription status = 'canceled'
     → UPDATE profiles SET is_pro = FALSE

3. Return 200 OK
```

#### 3. `create-portal-session`

| Detail | Value |
|--------|-------|
| **Trigger** | Called from Profile page "Manage Subscription" |
| **Input** | `user_id` (from auth) |
| **Action** | Create Stripe Billing Portal session |
| **Output** | `{ url: "https://billing.stripe.com/..." }` |

```
File: supabase/functions/create-portal-session/index.ts

Logic:
1. Verify JWT, get user_id
2. Look up stripe_customer_id from subscriptions table
3. Create portal session:
   stripe.billingPortal.sessions.create({
     customer: stripeCustomerId,
     return_url: `${APP_URL}/profile`
   })
4. Return { url: session.url }
```

### Stripe Dashboard Setup

1. **Create Product**: "Kettlebell Mastery Pro" → €3.00/month recurring
2. **Note the Price ID**: `price_xxx...` → use as `STRIPE_PRICE_ID`
3. **Set up Webhook Endpoint**: `https://<supabase-project>.supabase.co/functions/v1/stripe-webhook`
4. **Subscribe to events**: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. **Note Webhook Secret**: `whsec_xxx...` → use as `STRIPE_WEBHOOK_SECRET`
6. **Configure Billing Portal**: Enable in Stripe dashboard (Settings → Billing → Customer Portal)

### Frontend Payment Files

| File | Purpose |
|------|---------|
| `src/lib/stripeClient.js` | Helper: calls Edge Functions, redirects to Stripe |
| `src/components/payment/ProBanner.jsx` | Home page "Go Pro" notification banner |
| `src/components/payment/PaywallOverlay.jsx` | Lock overlay shown on Pro-only features |
| `src/components/payment/PaymentSuccess.jsx` | `/payment/success` — confirms subscription |
| `src/components/payment/PaymentCancel.jsx` | `/payment/cancel` — "Maybe later" page |
| `src/components/payment/ManageSubscription.jsx` | Button in Profile to open Billing Portal |

---

## 6. Home Page Pro Banner & UX

### Home Page Layout (Updated)

```
┌────────────────────────────────────┐
│         KETTLEBELL MASTERY          │  ← Header
├────────────────────────────────────┤
│                                    │
│  Welcome back, [Name]!    [photo]  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🚀 GO PRO — €3/month        │  │  ← Pro Banner (FREE users only)
│  │                              │  │
│  │  Unlock workout plans, full  │  │
│  │  analytics, AI assistant,    │  │
│  │  custom routines & more!     │  │
│  │                              │  │
│  │  [Upgrade Now]               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌─────────────┐ ┌──────────────┐  │
│  │ Progression │ │ Data & Logs  │  │  ← 2×2 cards
│  │  📊         │ │  📋  🔒      │  │     (🔒 = Pro lock badge on
│  └─────────────┘ └──────────────┘  │      locked features for
│  ┌─────────────┐ ┌──────────────┐  │      free users)
│  │ Shared      │ │ AI Insights  │  │
│  │  👥  🔒     │ │  🤖  🔒      │  │
│  └─────────────┘ └──────────────┘  │
│                                    │
│  [Choose Routine & Start Workout]  │
│                                    │
│  [Exercise Library]                │
│                                    │
├────────────────────────────────────┤
│  Home  Profile  Data  Exercises  ☰ │  ← Bottom Nav
└────────────────────────────────────┘
```

### Pro Banner Component Behavior

| State | Behavior |
|-------|----------|
| Not logged in | Show banner: "Create an account to start training!" |
| Free user | Show banner: "🚀 Go Pro — €3/month. Unlock all features! [Upgrade Now]" |
| Pro user | Banner hidden |
| Pro user (canceling) | Show banner: "Your Pro access ends on [date]. [Resubscribe]" |

---

## 7. Paywall Gate Logic

### ProGate Component

Create a reusable `<ProGate>` wrapper component that handles access control:

```
File: src/components/payment/ProGate.jsx

Usage:
  <ProGate feature="analytics">
    <Progress />          ← Rendered if user is Pro
  </ProGate>

Behavior:
  - If user is Pro → render children normally
  - If user is Free → render a preview/blurred version with PaywallOverlay on top
  - PaywallOverlay shows:
    • Lock icon
    • Feature name: "Analytics & Progress Tracking"
    • Brief description of what they'll get
    • [Go Pro — €3/month] button
    • [Maybe Later] dismiss button
```

### PaywallOverlay Visual

```
┌────────────────────────────────────┐
│                                    │
│    ┌──────────────────────────┐    │
│    │  (blurred preview of     │    │
│    │   the actual feature     │    │
│    │   content behind)        │    │
│    │                          │    │
│    │   ┌──────────────────┐   │    │
│    │   │      🔒           │   │    │
│    │   │                  │   │    │
│    │   │  Unlock Analytics │   │    │
│    │   │                  │   │    │
│    │   │  Track progress,  │   │    │
│    │   │  set goals, view  │   │    │
│    │   │  detailed charts  │   │    │
│    │   │  & insights.      │   │    │
│    │   │                  │   │    │
│    │   │ [Go Pro — €3/mo] │   │    │
│    │   │                  │   │    │
│    │   │  Maybe later      │   │    │
│    │   └──────────────────┘   │    │
│    └──────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
```

### Feature Gating Map

| Feature Key | Component(s) Gated | Preview for Free Users |
|---|---|---|
| `custom_routines` | RoutinePage ("My Routines" tab, "Build Your Own" tab) | Show tab with lock overlay; list example routines greyed out |
| `analytics` | Dashboard, Progress | Show charts with placeholder/sample data, blurred |
| `data_tracking` | WorkoutLog, WorkoutHistory, WeeklyMonthlyStats | Show empty state with sample screenshots |
| `body_metrics` | BodyMetrics | Show form fields disabled with sample data |
| `performance` | PerformanceMetrics | Show sample PR cards blurred |
| `schedule` | Schedule | Show calendar preview locked |
| `goals` | UserGoals (new) | Show sample goals locked |
| `ai_assistant` | AIAssistant | Show insight cards with lock; one teaser card visible |
| `share` | ShareWithFriends, Community | Show share UI locked |
| `full_profile` | Profile (age, goals, equipment fields) | Show fields greyed out with "Pro" badge |

---

## 8. AI Assistant Integration (Pro Only)

### Current State vs. Upgraded AI

| Aspect | Current (Local AI) | Upgraded (Pro AI) |
|--------|-------------------|-------------------|
| Engine | Deterministic JS algorithms in `aiService.js` | Hybrid: local algorithms + external LLM API |
| Insights | 6 fixed insight types | Dynamic, conversational, personalized |
| Interaction | Read-only insight cards | Chat-based Q&A + insight cards |
| Data access | localStorage only | Supabase (full history) |
| Availability | Was accessible to all | Pro users only |

### AI Assistant Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    AI ASSISTANT (PRO ONLY)                     │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI INSIGHTS DASHBOARD (existing, enhanced)              │   │
│  │                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │   │
│  │  │Consistency│ │ Volume   │ │ Goal     │                 │   │
│  │  │ Trend    │ │ Analysis │ │ Progress │                 │   │
│  │  └──────────┘ └──────────┘ └──────────┘                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │   │
│  │  │ Streak   │ │ Variety  │ │ Next     │                 │   │
│  │  │ Score    │ │ Rating   │ │ Action   │                 │   │
│  │  └──────────┘ └──────────┘ └──────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AI CHAT ASSISTANT (new, Pro only)                       │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  🤖 "Based on your last 4 weeks, I'd recommend  │    │   │
│  │  │     increasing your swing weight by 2kg.         │    │   │
│  │  │     Your consistency is great at 85%!"           │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  You: "Should I add more overhead presses?"      │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  🤖 "Yes! Your press volume is low compared to  │    │   │
│  │  │     pulls. I'd suggest adding 2 press sets per   │    │   │
│  │  │     session. Here's a suggested routine..."      │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  [Type your question...]              [Send]             │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### AI Integration Options

You have three options for the AI chat backend. Choose based on budget and complexity:

#### Option A: OpenAI API (Recommended for simplicity)

| Detail | Value |
|--------|-------|
| Provider | OpenAI (GPT-4o-mini for cost efficiency) |
| Endpoint | Called via Supabase Edge Function |
| Cost | ~$0.15–0.60 per 1M input tokens (very low per user) |

```
File: supabase/functions/ai-chat/index.ts

Logic:
1. Receive user message + user_id from frontend
2. Query Supabase for user context:
   - Recent workout_sessions (last 30 days)
   - body_metrics (latest entries)
   - personal_records
   - user_goals
   - profile (goals, equipment)
   - schedule
3. Build system prompt:
   "You are a kettlebell training AI coach for the Kettlebell Mastery app.
    You have access to the user's workout data, goals, and body metrics.
    Provide personalized, actionable advice for kettlebell training.
    Be encouraging, specific, and data-driven.
    User data: {JSON context}
    Respond concisely (under 150 words)."
4. Call OpenAI API with conversation history + system prompt
5. Return response to frontend
```

#### Option B: Anthropic Claude API

Same architecture as Option A, substitute Claude Sonnet for GPT-4o-mini. Slightly higher quality responses.

#### Option C: Local-only (No API cost, already exists)

Keep the existing `aiService.js` deterministic engine. Enhance it with more algorithms. No chat capability, just the 6 insight cards. This is the zero-cost option.

### AI Frontend Components

| File | Purpose |
|------|---------|
| `src/components/AIAssistant.jsx` | Enhanced: insight cards (existing) + chat interface (new, Pro) |
| `src/components/AIChatMessage.jsx` | Individual chat message bubble |
| `src/components/AIChatInput.jsx` | Text input + send button |
| `src/services/aiService.js` | Enhanced: local insights (existing) |
| `src/services/aiChatService.js` | New: calls Supabase Edge Function for AI chat |

### AI Chat Context Builder

```
File: src/services/aiContextBuilder.js

Purpose: Gathers user data from Supabase and formats it as context for the AI

Exports:
  buildAIContext(userId) → {
    recentWorkouts: [...],     // last 30 days
    bodyMetrics: {...},         // latest
    personalRecords: [...],
    goals: [...],
    schedule: {...},
    profile: { goals, equipment, age },
    stats: {
      totalWorkouts,
      currentStreak,
      avgWorkoutsPerWeek,
      favoriteExercises,
      volumeTrend
    }
  }
```

---

## 9. Analytics & Tracking (Pro Only)

### Analytics Dashboard Overview

All analytics features are Pro-only. Free users see blurred previews.

```
┌────────────────────────────────────────────────────────────────┐
│                 PRO ANALYTICS SUITE                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SUMMARY DASHBOARD (/dashboard)                          │   │
│  │                                                          │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                 │   │
│  │  │🔥 12 │  │📊 85%│  │🎯 3/4│  │⚡ 24 │                 │   │
│  │  │Streak│  │Adhere│  │Goals │  │Total │                 │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                 │   │
│  │                                                          │   │
│  │  Achievements: [🏅][🏅][🏅][ ][ ]                        │   │
│  │  Milestones:   "Next: 50 workouts (2 away!)"            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROGRESS CHARTS (/progress)                             │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────┐                 │   │
│  │  │  Weight Trend          📉            │                 │   │
│  │  │  85kg ┤                              │                 │   │
│  │  │  83kg ┤     ╲                        │                 │   │
│  │  │  81kg ┤       ╲___╱╲                 │                 │   │
│  │  │  79kg ┤              ╲___            │                 │   │
│  │  │       └──────────────────── weeks    │                 │   │
│  │  │  Use: Recharts <LineChart>           │                 │   │
│  │  └─────────────────────────────────────┘                 │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────┐                 │   │
│  │  │  Volume Over Time      📊            │                 │   │
│  │  │  ████                                │                 │   │
│  │  │  ████ ████                           │                 │   │
│  │  │  ████ ████ ████                      │                 │   │
│  │  │  ████ ████ ████ ████                 │                 │   │
│  │  │  W1   W2   W3   W4                  │                 │   │
│  │  │  Use: Recharts <BarChart>            │                 │   │
│  │  └─────────────────────────────────────┘                 │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────┐                 │   │
│  │  │  Workout Heat Map       🗓️           │                 │   │
│  │  │                                      │                 │   │
│  │  │  Mon ■■□■■■□■■□□■■■                  │                 │   │
│  │  │  Tue □■■□□■■□■■■□□■                  │                 │   │
│  │  │  Wed ■□■■■□■■□■■■■□                  │                 │   │
│  │  │  ...                                 │                 │   │
│  │  │  Use: Custom SVG or D3 heatmap       │                 │   │
│  │  └─────────────────────────────────────┘                 │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────┐                 │   │
│  │  │  Strength Per Exercise   💪          │                 │   │
│  │  │                                      │                 │   │
│  │  │  Swing    ████████████ 32kg          │                 │   │
│  │  │  Squat    █████████    24kg          │                 │   │
│  │  │  Press    ██████       16kg          │                 │   │
│  │  │  Snatch   ████████     20kg          │                 │   │
│  │  │  Use: Recharts <BarChart horizontal> │                 │   │
│  │  └─────────────────────────────────────┘                 │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────┐                 │   │
│  │  │  Goal Progress Meter    🎯           │                 │   │
│  │  │                                      │                 │   │
│  │  │  Workout Frequency   ████████░░ 80%  │                 │   │
│  │  │  Weight Goal         ██████░░░░ 60%  │                 │   │
│  │  │  Strength Target     ███████░░░ 70%  │                 │   │
│  │  │  Use: Recharts <RadialBarChart> or   │                 │   │
│  │  │       custom progress rings          │                 │   │
│  │  └─────────────────────────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATA & TRACKING (/data/*)                               │   │
│  │                                                          │   │
│  │  Tabs: Overview | Workout Log | History |                │   │
│  │        Weekly/Monthly | Body | Performance               │   │
│  │                                                          │   │
│  │  Each tab provides:                                      │   │
│  │  • Data entry forms                                      │   │
│  │  • History tables                                        │   │
│  │  • Trend charts                                          │   │
│  │  • Export capability                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Charting Library

Install `recharts` for all graphs and charts:

```bash
npm install recharts
```

| Chart Type | Component | Recharts Element |
|---|---|---|
| Weight trend line | Progress | `<LineChart>` with `<Line>`, `<XAxis>`, `<YAxis>`, `<Tooltip>` |
| Volume bar chart | Progress | `<BarChart>` with `<Bar>` |
| Workout heat map | Progress | Custom SVG grid (or use `<ScatterChart>` with custom shapes) |
| Strength per exercise | Progress | `<BarChart layout="vertical">` |
| Goal progress rings | Progress / Dashboard | `<RadialBarChart>` or `<PieChart>` |
| Weekly/monthly stats | WeeklyMonthlyStats | `<AreaChart>` and `<BarChart>` |
| Body composition | BodyMetrics | `<LineChart>` multi-line (weight, body fat) |
| PR timeline | PerformanceMetrics | `<LineChart>` with dots for each PR |

### Goal Tracking System (New, Pro Only)

```
File: src/components/Goals.jsx
Route: /goals

Goal types:
  • workouts_per_week  — "Work out 4 times per week"
  • weight_target      — "Reach 80kg body weight"
  • strength           — "Press 24kg kettlebell"
  • consistency        — "Maintain 90% adherence for 8 weeks"
  • custom             — Free-form goal with manual tracking

Each goal shows:
  • Title and description
  • Progress bar (current_value / target_value)
  • Deadline (if set)
  • Status badge (active / completed / abandoned)
  • AI suggestion for reaching it (Pro AI)
```

---

## 10. Updated Routes & Components

### New and Modified Routes

| Path | Component | Access | New? |
|------|-----------|--------|------|
| `/` | Home | All | Modified (Pro banner) |
| `/auth/callback` | AuthCallback | All | **New** — handles email verification redirect |
| `/payment/success` | PaymentSuccess | Registered | **New** |
| `/payment/cancel` | PaymentCancel | Registered | **New** |
| `/goals` | Goals | Pro | **New** |
| `/ai-assistant` | AIAssistant | Pro (chat), Free (locked preview) | Modified |
| `/routine` | RoutinePage | Mixed (curated: Free, custom: Pro) | Modified |
| `/timer-setup` | TimerSetup | Registered | Modified (auth gate) |
| `/session` | Session | Registered | Modified (saves to Supabase) |
| `/dashboard` | Dashboard | Pro | Modified (ProGate) |
| `/progress` | Progress | Pro | Modified (ProGate, Recharts) |
| `/schedule` | Schedule | Pro | Modified (ProGate) |
| `/community` | Community | Pro | Modified (ProGate) |
| `/profile` | Profile | Registered | Modified (partial fields locked) |
| `/library` | Library | All | Unchanged |
| `/data/*` | DataLayout + subs | Pro | Modified (ProGate) |

### New Components

| Component | Purpose |
|-----------|---------|
| `src/contexts/AuthContext.jsx` | Auth state, user, isPro, session management |
| `src/components/auth/RegisterModal.jsx` | Registration form (name, email, password, photo) |
| `src/components/auth/SignInModal.jsx` | Sign-in form |
| `src/components/auth/EmailVerification.jsx` | "Check your email" screen |
| `src/components/auth/ForgotPassword.jsx` | Password reset form |
| `src/components/auth/AuthCallback.jsx` | Handles email verification redirect |
| `src/components/auth/AuthGate.jsx` | Shows RegisterModal if user tries to start routine without account |
| `src/components/payment/ProBanner.jsx` | Home page Go Pro notification |
| `src/components/payment/PaywallOverlay.jsx` | Lock overlay for Pro features |
| `src/components/payment/ProGate.jsx` | Wrapper: children if Pro, overlay if Free |
| `src/components/payment/PaymentSuccess.jsx` | Post-payment confirmation page |
| `src/components/payment/PaymentCancel.jsx` | Payment canceled/declined page |
| `src/components/payment/ManageSubscription.jsx` | Button to open Stripe Billing Portal |
| `src/components/Goals.jsx` | Goal setting and tracking page |
| `src/components/AIChatMessage.jsx` | Chat message bubble |
| `src/components/AIChatInput.jsx` | Chat text input |

### Modified Components

| Component | Changes |
|-----------|---------|
| `App.jsx` | Wrap with `<AuthProvider>`, add new routes, add auth callback route |
| `Home.jsx` | Add `<ProBanner>`, add lock badges on cards for free users |
| `RoutinePage.jsx` | "My Routines" and "Build Your Own" wrapped in `<ProGate>` |
| `Profile.jsx` | Split fields: basic (all), advanced (ProGate). Add "Manage Subscription" |
| `Dashboard.jsx` | Wrap in `<ProGate feature="analytics">` |
| `Progress.jsx` | Wrap in `<ProGate>`, add Recharts graphs |
| `AIAssistant.jsx` | Wrap in `<ProGate>`, add chat interface for Pro |
| `Session.jsx` | Save to Supabase after session; require auth |
| `TimerSetup.jsx` | Require auth (AuthGate before starting) |
| `BottomNav.jsx` | Show lock icon on Data tab for free users |
| `MenuDrawer.jsx` | Show lock badges on Pro-only menu items |

---

## 11. Updated File Tree

```
kettlebell-app/
├── README.md
├── SETUP.md
├── FEATURES.md
├── DEPLOY.md
├── UPDATED_STRUCTURE.md                      ← THIS FILE
├── STRUCTURE_README.md                       ← Original structure
├── AUDIO_IMPLEMENTATION_GUIDE.md
├── AUDIO_TESTING.md
├── AI_FEATURES.md
├── AI_INTEGRATION_SUMMARY.md
├── AI_QUICKSTART.md
├── EXERCISE.md
├── design.md
├── supabase-schema.sql                       ← UPDATED (full schema above)
├── .env.example                              ← UPDATED (new vars)
├── package.json
├── vite.config.js
├── index.html
│
├── supabase/                                 ← NEW DIRECTORY
│   └── functions/
│       ├── create-checkout-session/
│       │   └── index.ts                      ← Stripe checkout Edge Function
│       ├── stripe-webhook/
│       │   └── index.ts                      ← Stripe webhook Edge Function
│       ├── create-portal-session/
│       │   └── index.ts                      ← Stripe billing portal Edge Function
│       └── ai-chat/
│           └── index.ts                      ← AI chat Edge Function (optional)
│
├── public/
│   ├── exercise-media/
│   │   ├── README.md
│   │   ├── images/
│   │   │   └── logos/
│   │   └── videos/
│   │       └── README.md
│   └── registration/
│       ├── README.md
│       ├── user-data.json
│       └── profile-photos/
│
└── src/
    ├── main.jsx
    ├── App.jsx                               ← MODIFIED (AuthProvider, new routes)
    ├── index.css                             ← MODIFIED (new design tokens for Pro)
    │
    ├── contexts/                              ← NEW DIRECTORY
    │   └── AuthContext.jsx                    ← Auth state, isPro, session management
    │
    ├── components/
    │   ├── AppLayout.jsx, AppLayout.module.css
    │   ├── BackLink.jsx, BackLink.module.css
    │   ├── BottomNav.jsx, BottomNav.module.css    ← MODIFIED (lock icons)
    │   ├── Button.jsx, Button.module.css
    │   ├── Community.jsx, Community.module.css     ← MODIFIED (ProGate)
    │   ├── CueList.jsx, CueList.module.css
    │   ├── Dashboard.jsx, Dashboard.module.css     ← MODIFIED (ProGate, Supabase data)
    │   ├── Data.jsx, Data.module.css
    │   ├── DataHome.jsx, DataHome.module.css       ← MODIFIED (ProGate)
    │   ├── DataLayout.jsx, DataLayout.module.css
    │   ├── ExerciseCard.jsx, ExerciseCard.module.css
    │   ├── ExerciseListItem.jsx, ExerciseListItem.module.css
    │   ├── FilterBar.jsx, FilterBar.module.css
    │   ├── Home.jsx, Home.module.css               ← MODIFIED (ProBanner, lock badges)
    │   ├── Landing.jsx, Landing.module.css
    │   ├── Layout.jsx, Layout.module.css
    │   ├── Library.jsx, Library.module.css
    │   ├── MenuDrawer.jsx, MenuDrawer.module.css   ← MODIFIED (lock badges)
    │   ├── PageHeader.jsx, PageHeader.module.css
    │   ├── Profile.jsx, Profile.module.css         ← MODIFIED (split fields, manage sub)
    │   ├── Progress.jsx, Progress.module.css       ← MODIFIED (ProGate, Recharts)
    │   ├── RoutinePage.jsx, RoutinePage.module.css ← MODIFIED (ProGate on tabs)
    │   ├── Schedule.jsx, Schedule.module.css       ← MODIFIED (ProGate)
    │   ├── ScrollPicker.jsx, ScrollPicker.module.css
    │   ├── Session.jsx, Session.module.css         ← MODIFIED (auth required, Supabase save)
    │   ├── SessionComplete.jsx, SessionComplete.module.css
    │   ├── SessionProgress.jsx, SessionProgress.module.css
    │   ├── ShareWithFriends.jsx, ShareWithFriends.module.css  ← MODIFIED (ProGate)
    │   ├── TimerDisplay.jsx, TimerDisplay.module.css
    │   ├── TimerSetup.jsx, TimerSetup.module.css   ← MODIFIED (AuthGate)
    │   ├── TopBar.jsx, TopBar.module.css
    │   ├── AIAssistant.jsx, AIAssistant.module.css ← MODIFIED (ProGate, chat)
    │   ├── AIInsightCard.jsx, AIInsightCard.module.css
    │   ├── AIChatMessage.jsx, AIChatMessage.module.css       ← NEW
    │   ├── AIChatInput.jsx, AIChatInput.module.css           ← NEW
    │   ├── Goals.jsx, Goals.module.css                       ← NEW
    │   ├── BodyMetrics.jsx, BodyMetrics.module.css ← MODIFIED (ProGate, Supabase)
    │   ├── PerformanceMetrics.jsx, PerformanceMetrics.module.css ← MODIFIED
    │   ├── WeeklyMonthlyStats.jsx, WeeklyMonthlyStats.module.css ← MODIFIED
    │   ├── WorkoutHistory.jsx, WorkoutHistory.module.css     ← MODIFIED
    │   ├── WorkoutLog.jsx, WorkoutLog.module.css             ← MODIFIED
    │   │
    │   ├── auth/                              ← NEW DIRECTORY
    │   │   ├── RegisterModal.jsx, RegisterModal.module.css
    │   │   ├── SignInModal.jsx, SignInModal.module.css
    │   │   ├── EmailVerification.jsx, EmailVerification.module.css
    │   │   ├── ForgotPassword.jsx, ForgotPassword.module.css
    │   │   ├── AuthCallback.jsx
    │   │   └── AuthGate.jsx, AuthGate.module.css
    │   │
    │   └── payment/                           ← NEW DIRECTORY
    │       ├── ProBanner.jsx, ProBanner.module.css
    │       ├── PaywallOverlay.jsx, PaywallOverlay.module.css
    │       ├── ProGate.jsx, ProGate.module.css
    │       ├── PaymentSuccess.jsx, PaymentSuccess.module.css
    │       ├── PaymentCancel.jsx, PaymentCancel.module.css
    │       └── ManageSubscription.jsx, ManageSubscription.module.css
    │
    ├── data/
    │   └── exercises.js
    │
    ├── lib/
    │   ├── constants.js
    │   ├── supabaseClient.js                  ← RENAMED from supabase.js, now required
    │   ├── stripeClient.js                    ← NEW (checkout/portal helpers)
    │   ├── dailyRotation.js
    │   ├── routines.js                        ← MODIFIED (Supabase for user routines)
    │   ├── routineDatabase.js                 ← DEPRECATED (migrated to Supabase)
    │   ├── trackingStorage.js                 ← MODIFIED (Supabase backend)
    │   ├── scheduleStorage.js                 ← MODIFIED (Supabase backend)
    │   ├── profileStorage.js                  ← MODIFIED (Supabase profiles table)
    │   ├── coachVoice.js
    │   ├── exerciseMedia.js
    │   ├── shareData.js
    │   └── registrationData.js                ← MODIFIED (export from Supabase)
    │
    └── services/
        ├── sessionService.js                  ← MODIFIED (always Supabase, not optional)
        ├── aiService.js                       ← MODIFIED (enhanced local insights)
        ├── aiChatService.js                   ← NEW (calls ai-chat Edge Function)
        ├── aiContextBuilder.js                ← NEW (builds context for AI)
        └── subscriptionService.js             ← NEW (check sub status, manage sub)
```

---

## 12. Environment Variables

### Updated `.env.example`

```env
# ============================================================
# SUPABASE (REQUIRED — no longer optional)
# ============================================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# STRIPE (REQUIRED for payment)
# ============================================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx...
# Note: Secret key and webhook secret go in Supabase Edge Function secrets,
#       NOT in the frontend .env

# ============================================================
# APP URL (REQUIRED for Stripe redirects)
# ============================================================
VITE_APP_URL=https://yourdomain.com

# ============================================================
# AI CHAT (OPTIONAL — only if using external AI)
# ============================================================
# Set in Supabase Edge Function secrets, NOT here:
# OPENAI_API_KEY=sk-xxx...
# or ANTHROPIC_API_KEY=sk-ant-xxx...
```

### Supabase Edge Function Secrets

Set these in Supabase dashboard (Settings → Edge Functions → Secrets):

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Price ID for €3/month subscription |
| `APP_URL` | Your app URL for redirects |
| `OPENAI_API_KEY` | OpenAI key (if using Option A for AI) |

---

## 13. Migration Checklist

### Data Migration (localStorage/IndexedDB → Supabase)

For existing users who already have data in localStorage:

```
File: src/lib/dataMigration.js

Purpose: One-time migration of existing local data to Supabase

Logic:
1. On first login, check if localStorage has existing data
2. If yes, prompt user: "We found existing workout data. Import it?"
3. If confirmed:
   a. Read all localStorage keys (workouts, body metrics, PRs, schedule, profile)
   b. Read IndexedDB user routines
   c. Upload to corresponding Supabase tables
   d. On success, mark migration complete (localStorage flag)
   e. Clear old localStorage data (optional, keep as backup)
4. If declined, start fresh
```

### Deprecation Plan

| Old Storage | New Storage | Migration |
|---|---|---|
| `localStorage: kettlebell-profile` | `Supabase: profiles` | Auto on first login |
| `localStorage: kettlebell-workouts` | `Supabase: workout_sessions` | Auto on first login |
| `localStorage: kettlebell-body-metrics` | `Supabase: body_metrics` | Auto on first login |
| `localStorage: kettlebell-prs` | `Supabase: personal_records` | Auto on first login |
| `localStorage: kettlebell-schedule` | `Supabase: schedules` | Auto on first login |
| `IndexedDB: KettlebellUserRoutines` | `Supabase: user_routines` | Auto on first login |

---

## 14. Implementation Order

Follow this order to build incrementally. Each phase produces a working app.

### Phase 1: Supabase Auth & Registration

| Step | Task |
|------|------|
| 1.1 | Set up Supabase project, enable email auth, configure email templates |
| 1.2 | Create `profiles` table with trigger |
| 1.3 | Create `supabaseClient.js` (replace old `supabase.js`) |
| 1.4 | Create `AuthContext.jsx` |
| 1.5 | Build `RegisterModal.jsx`, `SignInModal.jsx`, `EmailVerification.jsx` |
| 1.6 | Build `AuthGate.jsx` — trigger on "Start" routine |
| 1.7 | Build `AuthCallback.jsx` for email verification redirect |
| 1.8 | Modify `App.jsx` to wrap with `<AuthProvider>`, add auth routes |
| 1.9 | Modify `Profile.jsx` to show registration data |
| 1.10 | Test: full registration → email verify → sign in → profile |

### Phase 2: Supabase Data Layer

| Step | Task |
|------|------|
| 2.1 | Create all remaining tables (workout_sessions, user_routines, body_metrics, personal_records, schedules, user_goals) |
| 2.2 | Set up RLS policies |
| 2.3 | Modify `trackingStorage.js` to use Supabase |
| 2.4 | Modify `profileStorage.js` to use Supabase profiles |
| 2.5 | Modify `routines.js` to use Supabase user_routines |
| 2.6 | Modify `scheduleStorage.js` to use Supabase |
| 2.7 | Modify `sessionService.js` (Supabase is now required, not optional) |
| 2.8 | Create `dataMigration.js` for existing users |
| 2.9 | Set up Supabase Storage bucket for avatars |
| 2.10 | Test: all CRUD operations work via Supabase |

### Phase 3: Stripe Payment

| Step | Task |
|------|------|
| 3.1 | Create Stripe product + price (€3/month) |
| 3.2 | Create `subscriptions` table in Supabase |
| 3.3 | Deploy `create-checkout-session` Edge Function |
| 3.4 | Deploy `stripe-webhook` Edge Function |
| 3.5 | Deploy `create-portal-session` Edge Function |
| 3.6 | Configure Stripe webhook endpoint |
| 3.7 | Create `stripeClient.js` (frontend helper) |
| 3.8 | Create `subscriptionService.js` |
| 3.9 | Add `isPro` to `AuthContext` (check subscriptions table) |
| 3.10 | Build `PaymentSuccess.jsx`, `PaymentCancel.jsx` |
| 3.11 | Test: full payment flow → subscription active → isPro = true |

### Phase 4: Access Control & Paywall UI

| Step | Task |
|------|------|
| 4.1 | Build `ProGate.jsx`, `PaywallOverlay.jsx` |
| 4.2 | Build `ProBanner.jsx` for Home page |
| 4.3 | Wrap all Pro-only components with `<ProGate>` |
| 4.4 | Modify `Home.jsx` — add banner, lock badges |
| 4.5 | Modify `RoutinePage.jsx` — gate "My Routines" and "Build Your Own" |
| 4.6 | Modify `Profile.jsx` — gate advanced fields, add "Manage Subscription" |
| 4.7 | Modify `BottomNav.jsx`, `MenuDrawer.jsx` — lock badges |
| 4.8 | Build `ManageSubscription.jsx` |
| 4.9 | Test: free user sees locked features, Pro user has full access |

### Phase 5: Analytics & Charts

| Step | Task |
|------|------|
| 5.1 | Install `recharts` |
| 5.2 | Enhance `Progress.jsx` with Recharts graphs (weight, volume, heat map, strength, goals) |
| 5.3 | Enhance `Dashboard.jsx` with summary stats from Supabase |
| 5.4 | Enhance `WeeklyMonthlyStats.jsx` with charts |
| 5.5 | Enhance `BodyMetrics.jsx` with trend charts |
| 5.6 | Enhance `PerformanceMetrics.jsx` with PR timeline |
| 5.7 | Build `Goals.jsx` with progress rings |
| 5.8 | Add `/goals` route |
| 5.9 | Test: all charts render correctly with real data |

### Phase 6: AI Assistant Enhancement

| Step | Task |
|------|------|
| 6.1 | Enhance `aiService.js` local insights (works for insight cards) |
| 6.2 | Build `aiContextBuilder.js` |
| 6.3 | Build `aiChatService.js` |
| 6.4 | Deploy `ai-chat` Edge Function (with OpenAI or Claude) |
| 6.5 | Build `AIChatMessage.jsx`, `AIChatInput.jsx` |
| 6.6 | Enhance `AIAssistant.jsx` with chat UI below insight cards |
| 6.7 | Wrap in `<ProGate>` |
| 6.8 | Test: AI responds with personalized advice based on user data |

### Phase 7: Polish & Testing

| Step | Task |
|------|------|
| 7.1 | Test complete user journey: browse → register → verify email → free use → upgrade → Pro access |
| 7.2 | Test subscription lifecycle: subscribe → use → cancel → access until period end → lose access |
| 7.3 | Test edge cases: failed payment, expired session, re-subscribe |
| 7.4 | Mobile responsiveness for all new components |
| 7.5 | Design tokens for Pro badge, lock icon, paywall overlay |
| 7.6 | Error handling for Stripe, Supabase, and AI failures |
| 7.7 | Loading states for async operations |

---

## Summary of Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Supabase for all data | Single platform for auth, database, storage, and edge functions. Eliminates localStorage fragility. |
| Stripe Checkout (hosted) | No PCI compliance burden. Stripe handles all payment UI. |
| Edge Functions for Stripe | Keeps secret keys server-side. Webhook verification requires server. |
| ProGate wrapper pattern | Single reusable component for all paywall logic. Easy to add/remove gates. |
| Registration on "Start" | Low friction: users can browse freely, only register when committed. |
| Blurred previews for free users | Users see what they're missing, driving conversion. |
| Local + Cloud AI hybrid | Local insights work offline; cloud AI chat adds conversational depth for Pro. |
| Recharts for graphs | Lightweight, React-native, great for mobile. No D3 complexity. |

---

*This document should be used alongside the original `STRUCTURE_README.md`. The original describes the existing app architecture; this document describes what to add and change. Implement in the phased order above.*
