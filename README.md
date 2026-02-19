# Kettlebell Gym

Mobile-first web app for kettlebell workouts: dashboard, custom and pre-curated routines, work/countdown timer sessions with per-exercise media, progression tracking, and an exercise library. Frontend-only (Vite + React); no separate backend server. Optional Supabase for session history.

---

## Documentation

| File | Purpose |
|------|---------|
| **README.md** | This file – app structure, features, and reference. |
| **UPDATED_STRUCTURE.md** | Pro subscription architecture: Stripe, Supabase auth/data, tiered access, paywall, AI assistant, implementation order. |
| **structure_readme.md** | Single consolidated architecture doc: all README content in one structured, systematic order (entry → shell → routes → components → data → features → config → file tree). |
| **SETUP.md** | Quick setup: install, optional env, run, build, troubleshooting. |
| **FEATURES.md** | Detailed feature list and component overview. |
| **DEPLOY.md** | Deployment guide, env vars, hosting examples. |
| **AUDIO_IMPLEMENTATION_GUIDE.md** | Audio system implementation: coach voice, countdown beep, iOS unlock. |
| **AUDIO_TESTING.md** | Manual test checklist for coach voice and countdown beep. |
| **AI_FEATURES.md** | AI Assistant feature overview and data sources. |
| **AI_INTEGRATION_SUMMARY.md** | AI technical summary and file list. |
| **AI_QUICKSTART.md** | AI Assistant user guide. |
| **AI_STATUS.txt** | AI integration status checklist. |
| **EXERCISE.md** | Exercise list and IDs for media naming and reference. |
| **OPENAI_TTS_README.md** | Spec for OpenAI TTS integration (streaming + file generation). |
| **tts-server/** | Optional Node.js TTS server for **real** coach voice (OpenAI) only. Run `npm run dev` in `tts-server/` with `OPENAI_API_KEY` in `.env`; app proxies `/api` to it. No browser synthesis fallback—silent if TTS server is not running. |

---

## Changelog / updates

**Keep this section updated whenever the codebase changes** so the README stays an accurate history of the app.

| When | What changed |
|------|--------------|
| Latest | **Coach voice: real only (no synthesis)** – Coach uses only OpenAI TTS via `POST /api/tts/stream`; browser synthesis fallback removed so only one voice plays. If TTS server is down, coach is silent. Run `tts-server`: `cd tts-server && npm run dev` with `OPENAI_API_KEY` in `.env`. See `coachVoice.js`, `tts-server/src`, `vite.config.js` proxy. |
| — | **Real coach voice (OpenAI TTS)** – Coach uses **real** OpenAI TTS when the TTS server is running; otherwise falls back to browser synthesis. Run `tts-server`: `cd tts-server && npm run dev` with `OPENAI_API_KEY` in `.env`. App proxies `/api` to port 3000; `coachVoice.js` calls `POST /api/tts/stream` and plays MP3. See `tts-server/src`, `vite.config.js` proxy, OPENAI_TTS_README.md. |
| — | **OpenAI TTS server (optional)** – `tts-server/` with `example-generate.mjs`: generate speech via OpenAI API and save to `output.mp3`. Requires `OPENAI_API_KEY` in `tts-server/.env`. See OPENAI_TTS_README.md. |
| — | **Get-ready page & encouraging coach** – After "Start session", a 10s **Get-ready** page shows the first exercise video and countdown; coach says "Get ready. You've got this!" on first tap (unlocks audio). Then flows into Session. **Session coach:** says "Go! Give it everything you've got!" at start of each exercise; counts down last 10s with encouraging phrases ("Three! Keep it up!", "Two! Almost there!", "One! Last second!"); between exercises says "Nice work! Next up, [name]. You're doing great."; session end: "Amazing work! Session complete. You crushed it today!" Coach voice **defaults to Female** (on) unless set to Off in Profile. See `GetReady.jsx`, `coachVoice.js`, `profileStorage.js`. |
| — | **Pro subscription model (UPDATED_STRUCTURE)** – Supabase Auth (register, sign-in, email verification), AuthContext, auth components (RegisterModal, SignInModal, EmailVerification, ForgotPassword, AuthCallback, AuthGate). Stripe payment: ProBanner, PaywallOverlay, ProGate, PaymentSuccess/Cancel, ManageSubscription; Edge Functions (create-checkout-session, stripe-webhook, create-portal-session). New routes: /auth/callback, /payment/success, /payment/cancel, /goals. Home shows Pro banner and lock badges for free users; RoutinePage gates "Start" with registration and My Routines/Build your own with ProGate; Dashboard, Progress, DataHome, AIAssistant, Goals wrapped in ProGate. Profile: ManageSubscription, Sign out. Schema: supabase-schema.sql (profiles, subscriptions, workout_sessions, user_routines, body_metrics, personal_records, schedules, user_goals). See UPDATED_STRUCTURE.md. |
| — | **Session timer: countdown last 10 seconds** – During "Next in" phase, the numeric countdown (10, 9, … 1) is shown only for the last 10 seconds; first 10 seconds show "—". Last-10 number is emphasized (larger, accent color). See `TimerDisplay.jsx`, `TimerDisplay.module.css`. |
| — | **Header horizontal logo, Home fits without scroll** – Header uses horizontal Kettlebell Mastery logo (`kettlebell_mastery_logo_horizontal.png`) at 44px height; icon replaced in AppLayout only. Home card content fits without scrolling: 2×2 grid for dashboard cards, tighter hero/card padding and typography, `overflow: hidden` on home card. See `constants.js` (KETTLEBELL_HEADER_LOGO_URL), `AppLayout.jsx`, `Home.jsx`, `Home.module.css`. |
| — | **Transparent header, no page scroll** – Top header is transparent. Main content fits between header and bottom nav (no page scroll): wrapper and main use fixed height; main card (Layout) fills the gap and scrolls internally (`fillViewport`). Library (exercise cards) uses `fillViewport={false}` so it keeps normal scroll. See `AppLayout.module.css`, `Layout.jsx` (fillViewport), `Library.jsx`. |
| — | **Global top header** – App-wide top header in AppLayout with centered kettlebell icon (60×60px). Header is fixed at top on every page; main content padding adjusted. Icon removed from Layout (main card). Menu drawer header icon set to 60×60px. See `AppLayout.jsx`, `AppLayout.module.css`, `Layout.jsx`. |
| — | **Menu drawer header** – Kettlebell icon moved to center of header at 50×50px; “Menu” title below icon; close button remains top-right. See `MenuDrawer.jsx` and `MenuDrawer.module.css`. |
| — | **Landing page** – Full-screen first view on app open: Kettlebell Mastery logo, 10-word tagline (“Your pocket coach for kettlebell routines, timers, and progress.”), “Tap screen to continue”. White background; tap dismisses with dissolve transition to reveal Home. See `src/components/Landing.jsx`, `App.jsx` state `landingDismissed`. |
| — | **Coach voice error handling** – Speech synthesis `interrupted` (from `cancel()` or new utterance) is no longer logged as an error; only real synthesis errors are warned. See `src/lib/coachVoice.js` utterance.onerror. |
| — | **Audio system implemented** – Coach voice (Web Speech API) announces exercises during "Next in" countdown. Countdown beep (Web Audio API) plays each of the last 10 seconds (higher pitch for final 3). Profile dropdown: Off / Female / Male. Audio unlocked on first tap for iOS/Safari. See `src/lib/coachVoice.js`, `getCoachVoice()` in profileStorage, coach voice select in Profile, and audio integration in Session. |
| — | **Coach voice** – Profile preference: Coach voice (Off / Female / Male). During the “Next in” countdown, a voice announces the next exercise (“Next up: [name]. Get ready.”). Countdown beep plays in the last 10 seconds. Uses Web Speech API and Web Audio API; audio unlocks on first tap in session for iOS/Safari. See `src/lib/coachVoice.js`, `getCoachVoice()` in profileStorage. |
| — | **Session UI** – Timer block and controls moved to the lower part of the frame, above the bottom nav. Frosted glass container for the timer; white text; video only during work phase (no video during countdown). Background media constrained to mobile app boundary (max-width 430px). |
| — | **Session background video** – Per-exercise video uses absolute URLs (from current origin) so the video link works in dev and deployed subpaths. Video plays muted and loops; callback ref and onLoadedData/onCanPlay ensure playback. Optional override in `exerciseMedia.js`: `deadlift-2h` → `Two-Hand-Deadlift.mp4`. Fallback dark background when no media loads. |
| — | **Timer setup: narrow wheels, no “sec”** – Scroll pickers are 80px wide; wheels show 3 numbers (compact height); timer setup fits without scrolling. All app font colors set to black. Section spacing tightened. (Previously: each scroll picker was 30px wide; labels “Work” and “Rnds” and numbers fit within that width. No “sec” beside timing numbers. Both settings run horizontally in one row with a small gap. `ScrollPicker` supports a `narrow` prop for compact styling. |
| — | **Timer setup: pickers side by side** – Work (sec) and Rounds scroll pickers sit in one row with a small gap; the row is max 50% page width and centered. Single “Work & rounds” section with labels above each picker. |
| — | **Timer setup: scroll pickers** – Work duration (sec) and Rounds use a mobile-style scroll picker (`ScrollPicker`): user scrolls through values (work: 5–120 sec in steps of 5; rounds: 1–10); the centered row is the selection; snap on scroll end. Replaces number inputs. |
| — | **Rest timer removed** – Session flow is now Work → 20s “Next in” countdown → next exercise (no rest phase). Timer setup no longer has a “Rest (sec)” input. `TimerDisplay` shows only “Work” or “Next in”. |
| — | **AI Assistant** – Local insights page at `/ai-assistant`: 6 analyses (consistency, volume, goal, streak, variety, next action) from workouts, body metrics, schedule, profile. Entry from Home dashboard card (🤖 AI insights) and Menu (🤖 AI Assistant). No external API. |

When you add features, fix behaviour, or change structure, add a row here and update the relevant sections (routes, components, features, file tree) so the README stays in sync.

---

## Quick start (code instructions)

From the **project root**:

```bash
npm install
npm run dev      # Dev server (e.g. http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Serve dist/ locally (e.g. http://localhost:4173)
```

- **Optional:** Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for session history (see [Environment variables](#environment-variables)). Run `supabase-schema.sql` in Supabase SQL Editor if using Supabase.
- **Optional – real coach voice (OpenAI TTS):** Run the TTS server so the app uses a real voice instead of browser synthesis. In a second terminal: `cd tts-server && npm run dev`. Add `OPENAI_API_KEY=sk-...` to `tts-server/.env` (no space after `=`). Vite proxies `/api` to the TTS server; when it’s running, coach phrases are played via OpenAI. See [OPENAI_TTS_README.md](OPENAI_TTS_README.md).
- **Full steps and troubleshooting:** [SETUP.md](SETUP.md).

---

## App structure

### Entry and shell

| File | Role |
|------|------|
| `index.html` | Entry HTML; loads `src/main.jsx` |
| `src/main.jsx` | Mounts React app with `<AuthProvider>` and `<App />` |
| `src/App.jsx` | React Router; defines all routes; wraps routes in `<AppLayout />`; renders **Landing** overlay; routes for `/auth/callback`, `/payment/success`, `/payment/cancel`, `/goals` |
| `src/components/AppLayout.jsx` | Shell: **top header** (fixed, horizontal Kettlebell Mastery logo), full-screen background, `<main>` for content, `BottomNav`, `MenuDrawer` |
| `src/components/Landing.jsx` | First screen: full-screen overlay with logo, tagline, “Tap screen to continue”; dissolves to Home on tap |

### Routes and page components

| Path | Component | Description |
|------|-----------|-------------|
| `/` | **Home** | Dashboard: welcome, Pro banner (free users), cards with lock badges (Pro), “Choose routine” button |
| `/auth/callback` | **AuthCallback** | Email verification / password reset redirect handler |
| `/payment/success` | **PaymentSuccess** | Post-Stripe checkout success; confirms Pro access |
| `/payment/cancel` | **PaymentCancel** | User canceled checkout |
| `/goals` | **Goals** | Goal setting and tracking (Pro) |
| `/ai-assistant` | **AIAssistant** | AI insights (ProGate); consistency, volume, goal, streak, variety, next action |
| `/routine` | **RoutinePage** | Tabs: Pre-curated (auth to start), My routines / Build your own (ProGate); select or create routine → timer setup |
| `/timer-setup` | **TimerSetup** | Scroll pickers for work (sec) and rounds; list exercises from routine or today’s rotation; Start session → Get-ready |
| `/get-ready` | **GetReady** | 10s countdown with first exercise video; coach "Get ready. You've got this!" on tap; then Session |
| `/session` | **Session** | Live workout: work → 10s “Next in” countdown → next exercise; next exercise video through countdown; encouraging coach; timer at bottom, frosted UI |
| `/dashboard` | **Dashboard** | Summary: streak, workouts, goal %, adherence, achievements (ProGate) |
| `/progress` | **Progress** | Charts: weight, measurements, volume, heat map, strength, goals (ProGate) |
| `/schedule` | **Schedule** | Workout/rest days, deload, reminders |
| `/community` | **Community** | Share with friends + placeholders |
| `/profile` | **Profile** | Profile form; Manage Subscription (Pro); Sign out when logged in |
| `/library` | **Library** | Exercise library with category filter and expandable cues |
| `/data` | **DataLayout** + **DataHome** | Data shell; overview cards (ProGate) to sub-pages |
| `/data/workouts` | **WorkoutLog** | Log a workout: date, duration, exercises, RPE, energy, skipped, PRs |
| `/data/history` | **WorkoutHistory** | Full table of all logged workouts |
| `/data/stats` | **WeeklyMonthlyStats** | Workouts completed, time, volume, favorite exercises |
| `/data/body` | **BodyMetrics** | Weight, measurements, body fat, progress photo |
| `/data/performance` | **PerformanceMetrics** | PRs log, volume over time |

### Layout and navigation components

| Component | Purpose |
|-----------|---------|
| **AppLayout** | Wrapper: fixed transparent top header (horizontal logo), background, main content area (fits between header and nav, no page scroll), BottomNav, MenuDrawer |
| **BottomNav** | Fixed bottom bar: Home, Profile, Data, Exercises, Menu (hamburger) |
| **MenuDrawer** | Slide-up drawer from Menu: links to all sections (Main, Progress, Data, Schedule, Community, Profile, Exercises) |
| **Landing** | First screen on open: logo, tagline, “Tap screen to continue”; white full-screen overlay; dissolve to Home on tap |
| **Layout** | Page wrapper: max-width, glass panel, centred content; `fillViewport` (default true) fits card between header and nav with scroll inside card; Library uses `fillViewport={false}` |
| **PageHeader** | Title + optional subtitle |
| **BackLink** | “← Back” link |

### Session flow components

| Component | Purpose |
|-----------|---------|
| **GetReady** | Pre-session: 10s countdown with first exercise video; coach "Get ready. You've got this!" on first tap; then Session |
| **Session** | Phases (work, 10s countdown); next exercise video during countdown; encouraging coach (Start, 3-2-1, next exercise, complete); timer at bottom, frosted container |
| **TimerDisplay** | Shows phase (Work / Next in), countdown number, exercise name; "Next in" countdown 10…1 |
| **SessionProgress** | “Round X / Y · Exercise A / B” |
| **SessionComplete** | End-of-session summary and link home |
| **CueList** | Up to 3 form cues for current exercise |

### Shared UI components

| Component | Purpose |
|-----------|---------|
| **Button** | Primary/secondary/glass button; supports `as={Link}` |
| **ExerciseCard** | Card for one exercise (name, reps/seconds, “each side”) |
| **ExerciseListItem** | List row for exercise with expandable cues |
| **FilterBar** | Category filter (All, Hinge, Squat, …) |
| **ShareWithFriends** | Checkboxes (progression, exercise data, name) + Share button; uses share sheet or copy |
| **ScrollPicker** | Mobile-style scroll picker: scroll to select a value; centered row = selection; optional unit (e.g. sec); snap on scroll end |
| **AIAssistant** | Full AI page: 6 insights, refresh button; route `/ai-assistant` |
| **AIInsightCard** | Card for one insight (title, summary, metric, optional CTA link) |

### Data section components

| Component | Purpose |
|-----------|---------|
| **DataLayout** | Tabs: Overview, Workout log, History, Weekly/Monthly, Body, Performance |
| **DataHome** | Overview cards linking to each data sub-page |
| **WorkoutLog** | Form to log workout + recent list (first 5) |
| **WorkoutHistory** | Scrollable table of all workouts (date, duration, exercises, volume, RPE, etc.) |
| **WeeklyMonthlyStats** | Aggregated stats (workouts, time, volume, favorites) |
| **BodyMetrics** | Form to log weight/measurements + history |
| **PerformanceMetrics** | PRs list and volume over time |

### Data, lib, and services

| Location | File | Purpose |
|----------|------|---------|
| **src/data/** | `exercises.js` | 30 exercises (id, name, category, cues, defaultReps/Seconds); categories list |
| **src/lib/** | `constants.js` | KETTLEBELL_ICON_URL, KETTLEBELL_HEADER_LOGO_URL (horizontal logo for header) |
| | `supabase.js` | Supabase client (optional; requires env vars) |
| | `dailyRotation.js` | Date-based exercise rotation: getDailyExercises, getExercisesByCategory |
| | `routines.js` | Curated routines + user routines API (getRoutines, saveUserRoutine, deleteUserRoutine, getExercisesByIds) |
| | `routineDatabase.js` | IndexedDB “KettlebellUserRoutines”, store “routines”; getRoutines, saveRoutine, deleteRoutine; migration from localStorage |
| | `trackingStorage.js` | Workouts, body metrics, PRs (localStorage): getWorkouts, saveWorkout, getBodyMetrics, saveBodyMetric, getPRs, savePR |
| | `scheduleStorage.js` | Schedule and reminders (localStorage): getSchedule, saveSchedule |
| | `profileStorage.js` | loadProfile, getDisplayName, getPhotoUrl, getCoachVoice (off/female/male; default female so coach is on) |
| | `coachVoice.js` | speak, speakGetReady, speakStart, speakCountdownNumber, speakNextExerciseIs, speakSessionStart, speakSessionComplete, playCountdownBeep, unlockAudio, preloadVoices; encouraging phrases; Web Speech API + Web Audio API |
| | `exerciseMedia.js` | getExerciseMedia(id) → video/image URLs under public/exercise-media/; optional filename overrides (e.g. deadlift-2h → Two-Hand-Deadlift.mp4); URLs built absolute from current origin |
| | `shareData.js` | buildShareText, shareOrCopy (Web Share API or clipboard) |
| | `registrationData.js` | getAllUserData() – export profile, workoutHistory, bodyMetrics, prs, schedule, userRoutines to registration table shape |
| **src/services/** | `sessionService.js` | saveSession, getRecentSessions (Supabase workout_sessions) |
| | `aiService.js` | Local AI engine: 6 analyses (consistency, volume, goal, streak, variety, next action); getAllInsights, getTopInsight |

### Public assets

| Path | Purpose |
|------|---------|
| `public/exercise-media/` | Per-exercise images and videos for session background |
| `public/exercise-media/images/` | `&lt;exercise-id&gt;.jpg` or `.webp` |
| `public/exercise-media/images/logos/` | App branding: `kettlebell_mastery_logo.png` (Landing), `kettlebell_mastery_logo_horizontal.png` (header), `kettlebell_logo_icon_col.png` (nav, menu) |
| `public/exercise-media/videos/` | `&lt;exercise-id&gt;.mp4` (or override name, e.g. `Two-Hand-Deadlift.mp4` for `deadlift-2h`; see `src/lib/exerciseMedia.js`) |
| `public/registration/` | User data table schema and profile-photos folder |
| `public/registration/user-data.json` | Schema for profile, workoutHistory, bodyMetrics, prs, schedule, userRoutines, sessionHistory |
| `public/registration/profile-photos/` | Intended for backend-uploaded profile photos |

### Full file tree

```
kettlebell-app/
├── README.md
├── SETUP.md
├── FEATURES.md
├── DEPLOY.md
├── AUDIO_IMPLEMENTATION_GUIDE.md
├── AUDIO_TESTING.md
├── EXERCISE.md
├── supabase-schema.sql
├── .env.example
├── package.json
├── vite.config.js
├── index.html
├── public/
│   ├── exercise-media/
│   │   ├── README.md
│   │   ├── images/
│   │   └── videos/
│   │       └── README.md   # add <exercise-id>.mp4 or override (e.g. Two-Hand-Deadlift.mp4)
│   └── registration/
│       ├── README.md
│       ├── user-data.json
│       └── profile-photos/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── AppLayout.jsx, AppLayout.module.css
    │   ├── BackLink.jsx, BackLink.module.css
    │   ├── BottomNav.jsx, BottomNav.module.css
    │   ├── Button.jsx, Button.module.css
    │   ├── Community.jsx, Community.module.css
    │   ├── CueList.jsx, CueList.module.css
    │   ├── Dashboard.jsx, Dashboard.module.css
    │   ├── Data.jsx, Data.module.css
    │   ├── DataHome.jsx, DataHome.module.css
    │   ├── DataLayout.jsx, DataLayout.module.css
    │   ├── ExerciseCard.jsx, ExerciseCard.module.css
    │   ├── ExerciseListItem.jsx, ExerciseListItem.module.css
│   ├── FilterBar.jsx, FilterBar.module.css
│   ├── GetReady.jsx, GetReady.module.css
│   ├── Home.jsx, Home.module.css
│   ├── Landing.jsx, Landing.module.css
    │   ├── Layout.jsx, Layout.module.css
    │   ├── Library.jsx, Library.module.css
    │   ├── MenuDrawer.jsx, MenuDrawer.module.css
    │   ├── PageHeader.jsx, PageHeader.module.css
    │   ├── Profile.jsx, Profile.module.css
    │   ├── Progress.jsx, Progress.module.css
    │   ├── RoutinePage.jsx, RoutinePage.module.css
    │   ├── Schedule.jsx, Schedule.module.css
    │   ├── ScrollPicker.jsx, ScrollPicker.module.css
    │   ├── Session.jsx, Session.module.css
    │   ├── SessionComplete.jsx, SessionComplete.module.css
    │   ├── SessionProgress.jsx, SessionProgress.module.css
    │   ├── ShareWithFriends.jsx, ShareWithFriends.module.css
    │   ├── TimerDisplay.jsx, TimerDisplay.module.css
    │   ├── TimerSetup.jsx, TimerSetup.module.css
    │   ├── TopBar.jsx, TopBar.module.css
    │   ├── AIAssistant.jsx, AIAssistant.module.css
    │   ├── AIInsightCard.jsx, AIInsightCard.module.css
    │   ├── BodyMetrics.jsx, BodyMetrics.module.css
    │   ├── PerformanceMetrics.jsx, PerformanceMetrics.module.css
    │   ├── WeeklyMonthlyStats.jsx, WeeklyMonthlyStats.module.css
    │   ├── WorkoutHistory.jsx, WorkoutHistory.module.css
    │   └── WorkoutLog.jsx, WorkoutLog.module.css
    ├── data/
    │   └── exercises.js
    ├── lib/
    │   ├── constants.js
    │   ├── supabase.js
    │   ├── dailyRotation.js
    │   ├── routines.js
    │   ├── routineDatabase.js
    │   ├── trackingStorage.js
    │   ├── scheduleStorage.js
    │   ├── profileStorage.js
    │   ├── coachVoice.js
    │   ├── exerciseMedia.js
    │   ├── shareData.js
    │   └── registrationData.js
    └── services/
        ├── sessionService.js
        └── aiService.js
```

---

## Features

### Landing (first screen)

- **On app open** – Full-screen white overlay with Kettlebell Mastery logo (`public/exercise-media/images/logos/kettlebell_mastery_logo.png`), 10-word tagline, and “Tap screen to continue”.
- **Dismiss** – Tap (or Enter/Space) dismisses the overlay with a dissolve transition; Home dashboard is revealed underneath. Shown on every load.

### Home dashboard

- **Layout** – Content fits in the card without scrolling (2×2 dashboard grid, compact hero and typography).
- **Welcome** – Personalized greeting using the user’s name (from Profile).
- **Profile picture** – User photo or initial in a circle.
- **Dashboard cards** – 2×2 grid; links to:
  - **Progression charts** – Weight, volume, strength, goal progress.
  - **Data & logs** – Workout log, body metrics, PRs; shows recent workout count.
  - **Shared by friends** – Placeholder for messages/progress shared with you.
- **Primary action** – “Choose routine & start workout” → Routine selection page.
- **Exercise library** – Link to full exercise list with cues.

### Routines

- **Pre-curated** – Today’s rotation, Quick 6, Full body, Strength focus, Cardio flow.
- **My routines** – User-curated routines saved in the **app’s routine database** (IndexedDB: `KettlebellUserRoutines`, store: `routines`). Load from DB when tab opens; each routine has a Delete button.
- **Build your own** – Pick exercises in order, optional name, optional “Save as my routine” (saves to routine database).
- **Flow** – Select or build a routine → Continue to timer setup → Start session.

### Timer setup

- **Exercises** – From the chosen routine, or today’s rotation if opened without a routine.
- **Work & rounds** – Two scroll pickers side by side, each 80px wide; wheels show 3 numbers (compact height). Labels “Work” and “Rnds”; numbers only (no “sec”). Work 5–120 in steps of 5, Rounds 1–10. Scroll to set; text fits within wheel width.
- **Start session** – Navigates to **Get-ready** with exercises, work seconds, and rounds.

### Get-ready (pre-session)

- **Flow** – 10-second countdown with the **first exercise video** (or image) as background. Tap once to unlock audio and hear the coach: "Get ready. You've got this!" When the countdown reaches 0, the app navigates to Session so the same video continues into the first exercise.

### Session (workout)

- **Phases** – **Work** → **10s “Next in” countdown** → next exercise (or next round / finish). Timer runs continuously. The **next exercise's video** plays during the countdown and continues into the next work phase.
- **Layout** – Timer block and controls sit at the **bottom** of the screen, above the bottom nav, inside a frosted glass container. Background video/image during both work and "Next in" (next exercise's media). Media stays within the mobile app boundary (max 430px).
- **Coach voice** – Default **on** (Female) in Profile. Encouraging phrases: at start of each exercise “Go! Give it everything you've got!”; last 10s of work: “Three! Keep it up!”, “Two! Almost there!”, “One! Last second!”; between exercises “Nice work! Next up, [name]. You're doing great.”; session end “Amazing work! Session complete. You crushed it today!” Beep in last 10s of “Next in”. First tap (Get-ready or Session) unlocks audio on iOS/Safari.
- **Per-exercise background** – Optional image or video per exercise (see [Exercise media](#exercise-media-images--videos)); next exercise's media shown during countdown. Dark overlay for readability.
- **Progress** – “Round X / Y · Exercise A / B”; current exercise name and up to 3 form cues during work.
- **Controls** – Pause/Start, Quit. Session auto-starts on load.

### Progress & charts

- **Weight over time** – Line chart from body metrics.
- **Body measurements** – Line chart per measurement (chest, waist, hips, etc.).
- **Volume progression** – Bar chart by week.
- **Workout frequency** – ~90-day heat map.
- **Strength per exercise** – Line chart of volume over time (per exercise).
- **Goal progress** – Percentage meter when target weight is set (Profile).

### Summary dashboard

- Current streak, workouts this week/month, total training time.
- Progress toward goal (%), adherence rate.
- Current vs. starting stats, recent achievements, next milestone.
- Links to charts and data.

### Data & tracking

- **Workout log** – Date/time, duration, exercises (sets/reps/weight), RPE, energy, PRs, skipped.
- **Workout history** – Full table of all logged workouts (date, time, planned/actual min, exercises, volume, RPE, energy, modifications, skipped, PRs). Scrollable; matches the registration data table schema.
- **Weekly/Monthly** – Workouts completed, total time, volume, favorite exercises.
- **Body metrics** – Weight, measurements, body fat, progress photo.
- **Performance** – PRs log, volume over time.
- Workouts, body metrics, and PRs stored in **localStorage** (`kettlebell-workouts`, `kettlebell-body-metrics`, `kettlebell-prs`). Schema and export shape in `public/registration/user-data.json`.

### Schedule & reminders

- **Workout days** – Tap days you usually train.
- **Rest days** – Mark typical rest days.
- **Deload** – Schedule a lighter week every N weeks (or off).
- **Reminders** – Workout, weigh-in, measurements, progress photos (each with time). Note: notifications require device permission.
- Stored in **localStorage** (`kettlebell-schedule`).

### Community & sharing

- **Share with friends** – Build a text summary (progression and/or exercise data, optional name), then use the device share sheet or copy to clipboard.
- Placeholders for: challenge friends, leaderboards (coming soon).

### Profile

- **Basic info** – Name, age, gender, photo, weight, height, target weight, body measurements, fitness level, experience, injuries.
- **Coach voice** – Off / Female / Male. Default **Female** (coach on). When on, encouraging phrases during Get-ready, Session (Start, countdown 3-2-1, next exercise, complete); beep in last 10s of “Next in”.
- **Edit photo** – Button to upload a profile picture; image stored as base64 in profile (compressed if needed) so it persists. With a backend, photos can be stored under `public/registration/profile-photos/`.
- **Equipment** – Kettlebell weights, other equipment, space.
- **Goals** – Primary/secondary goals, timeline, duration, days per week, preferred times, rest days.
- Stored in **localStorage** (`kettlebell-profile`). Profile and all user data shapes are defined in the **registration data table** (`public/registration/user-data.json`).

### Exercise library

- All exercises with category filter (Hinge, Squat, Press, Pull, Carry, Mobility, Compound, Core).
- Expand for full form cues; “Today” badge when in today’s rotation.

### Navigation

- **Bottom nav** – Home, Profile, Data, Exercises, **Menu** (hamburger).
- **Menu drawer** – Sections: Main (Home, Choose routine, Dashboard, Start session), Progress & charts, Summary dashboard, Data & tracking (includes Workout history), Schedule & reminders, Community & more (Profile, Exercises). Tap a link to navigate and close the drawer.

---

## Exercise media (images & videos)

Session backgrounds use **per-exercise images or videos** stored in the app (not in the database). Media URLs are built from the current origin so they work in dev and when the app is served from a subpath.

### Location and naming

- **Folder** – `public/exercise-media/`
  - **Images:** `images/<exercise-id>.jpg` or `images/<exercise-id>.webp`
  - **Videos:** `videos/<exercise-id>.mp4`
- If the filename doesn’t match the exercise id, add an override in `src/lib/exerciseMedia.js` (e.g. `deadlift-2h` → `Two-Hand-Deadlift.mp4`).
- If both image and video exist for an exercise, **video** is used (muted, looping). Otherwise the image is used. On video load error, the app falls back to the image.

### Exercise IDs

Use these exact IDs as filenames (no extension in the ID):

`swing-2h`, `swing-1h`, `goblet-squat`, `tgu`, `clean`, `snatch`, `press`, `push-press`, `row`, `deadlift-2h`, `deadlift-1h`, `front-squat`, `halo`, `windmill`, `figure-8`, `around-world`, `thruster`, `clean-squat-press`, `single-leg-deadlift`, `lunge`, `cossack`, `bottoms-up-press`, `bent-over-row`, `high-pull`, `suitcase-carry`, `rack-walk`, `farmers-walk`, `plank-hold`, `dead-stop-swing`, `alternating-swings`

### Tips

- Use landscape or square for best fill; the app uses `object-fit: cover`.
- Keep file size reasonable for mobile (e.g. &lt; 5 MB per video).
- Videos play muted and loop; no audio is used. Use H.264 in an MP4 container for best browser support.
- Run the app with `npm run dev` from the **kettlebell-app** folder so the dev server serves `public/` and media paths resolve correctly.

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Home dashboard (welcome, photo, cards, “Choose routine”) |
| `/routine` | Choose routine: pre-curated, my routines, or build your own |
| `/timer-setup` | Scroll pickers for work (sec) and rounds; exercises from routine or today’s rotation; Start session → Get-ready |
| `/get-ready` | 10s countdown with first exercise video; coach "Get ready"; then Session |
| `/session` | Live workout: work → 10s countdown → next exercise; next exercise video through countdown; encouraging coach; timer at bottom |
| `/dashboard` | Summary dashboard (streak, goal %, achievements, etc.) |
| `/progress` | Charts: weight, measurements, volume, heat map, strength, goal |
| `/schedule` | Workout days, rest days, deload, reminders |
| `/community` | Share with friends, placeholders for challenges/leaderboards |
| `/profile` | User profile (name, photo, goals, equipment, etc.) |
| `/library` | Exercise library with categories and cues |
| `/data` | Data layout with tabs: Workout log, History, Weekly/Monthly, Body, Performance |
| `/data/history` | Workout history – full table of all logged workouts |

---

## Tech stack

- **React 18** – UI and hooks.
- **React Router 6** – Client-side routes.
- **Vite** – Dev server, build, preview.
- **CSS Modules** – Component-scoped styles (`*.module.css`).
- **Recharts** – Charts on Progress and dashboard.
- **Supabase** (optional) – Postgres for `workout_sessions`; app works without env vars.

---

## Data and storage

### Exercises

- **File** – `src/data/exercises.js`.
- **Fields** – `id`, `name`, `category`, `cues[]`, `defaultReps` or `defaultSeconds`, optional `side: true`.
- **Categories** – hinge, squat, press, pull, carry, mobility, compound, core.

### Daily rotation

- **File** – `src/lib/dailyRotation.js`.
- **API** – `getDailyExercises(date, count)`, `getDailyExerciseIds(date, count)`, `isInTodayRotation(id, date, count)`, `getExercisesByCategory(categoryId)`.
- Seeded shuffle by date: same day → same exercise set and order.

### Routines

- **File** – `src/lib/routines.js` (curated) and `src/lib/routineDatabase.js` (user routines).
- **Curated** – `getCuratedRoutines()` (Today’s rotation, Quick 6, Full body, Strength, Cardio).
- **User** – `getRoutines()` (async, from DB), `getUserRoutines()` (sync, from cache), `saveUserRoutine(routine)` (async), `deleteUserRoutine(id)` (async), `getUserRoutineExercises(routine)`, `getExercisesByIds(ids)`.
- **Storage** – User routines in the **routine database**: IndexedDB `KettlebellUserRoutines`, object store `routines` (keyPath: `id`). Each routine: `{ id, name, exerciseIds[], createdAt? }`. Legacy localStorage data is migrated into the DB on first load.

### Profile

- **Storage** – localStorage (`kettlebell-profile`).
- **Helpers** – `src/lib/profileStorage.js`: `loadProfile()`, `getDisplayName()`, `getPhotoUrl()`.

### Tracking (workouts, body, PRs)

- **File** – `src/lib/trackingStorage.js`.
- **Keys** – `kettlebell-workouts`, `kettlebell-body-metrics`, `kettlebell-prs`.
- **APIs** – `getWorkouts()`, `saveWorkout()`, `getBodyMetrics()`, `saveBodyMetric()`, `getPRs()`, `savePR()`.

### Schedule

- **File** – `src/lib/scheduleStorage.js`.
- **Key** – `kettlebell-schedule`.
- **APIs** – `getSchedule()`, `saveSchedule()`.

### Registration data table

- **Folder** – `public/registration/`.
- **File** – `user-data.json`: schema for all app data so it corresponds to every option – **profile**, **workoutHistory** (exercise history), **bodyMetrics**, **prs**, **schedule**, **userRoutines** (routine database), **sessionHistory**. Used for reference and export shape.
- **Profile photos** – `public/registration/profile-photos/` (for future backend uploads); app currently stores profile photo as base64 in profile.
- **Export** – `src/lib/registrationData.js`: `getAllUserData()` returns `{ profile, workoutHistory, bodyMetrics, prs, schedule, userRoutines }` from current storage (localStorage + routine DB cache) in the same shape as the data table.

### Supabase (optional)

- **Client** – `src/lib/supabase.js` (only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set).
- **Session service** – `src/services/sessionService.js`: `saveSession()`, `getRecentSessions()`.
- **Schema** – `supabase-schema.sql`: table `workout_sessions`. RLS allows anonymous insert/select.

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Install | `npm install` | Install dependencies (run once from `kettlebell-app`) |
| Dev | `npm run dev` | Start Vite dev server (e.g. http://localhost:5173) |
| Build | `npm run build` | Production build → `dist/` |
| Preview | `npm run preview` | Serve `dist/` locally (e.g. http://localhost:4173) |

See [Quick start](#quick-start-code-instructions) above. Run all commands from the **project root**.

---

## Environment variables

Only needed for optional Supabase session persistence. Without them, the app runs fully using localStorage and IndexedDB.

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

**Setup:** `cp .env.example .env` then set the two variables. They must be present at **build time** when deploying. See **SETUP.md** and **DEPLOY.md** for details.

---

## Development notes

- **Entry** – `index.html` → `src/main.jsx` → `App` (router + routes).
- **Styling** – Global tokens in `src/index.css`; per-component styles in `*.module.css`. Design: light fitness theme, orange/indigo accents, glass panels, max-width 430px (mobile-first).
- **Session state** – Exercises and intervals passed via React Router `location.state` from Routine page or TimerSetup to Session. Timer runs in a single interval; phase transitions (work → countdown → next) use a “just hit zero” ref to avoid double-firing.
- **README upkeep** – When you change the app (new routes, components, features, or behaviour), update this README: add a row to the **Changelog / updates** table and adjust the relevant sections (routes, components, features, file tree) so the doc stays an accurate, up-to-date history.
- **Exercise media** – URLs from `src/lib/exerciseMedia.js` (`getExerciseMedia(exerciseId)`). Files live under `public/exercise-media/`; no backend required. URLs are absolute (current origin) so session background video works in all environments. Optional overrides map exercise id to a different filename (e.g. `deadlift-2h` → `Two-Hand-Deadlift.mp4`).
- **Routine database** – User-curated routines live in IndexedDB (`KettlebellUserRoutines`). Open with `indexedDB.open('KettlebellUserRoutines', 1)`; object store `routines` holds `{ id, name, exerciseIds, createdAt }`.
- **Coach voice** – Profile stores `coachVoice` (off/female/male). `src/lib/coachVoice.js` uses SpeechSynthesis for announcements and Web Audio API for the countdown beep. Call `unlockAudio()` from a user gesture (e.g. first tap in session) so beeps work on iOS/Safari. The `utterance.onerror` handler ignores `interrupted` (expected when cancelling or superseding speech) and only logs real synthesis errors.
- **Where data lives** – No database file in the repo. Profile, workouts, body metrics, PRs, schedule in **localStorage**. User routines in **IndexedDB**. Optional session history in **Supabase** (cloud). Registration folder holds schema and profile-photos folder only.

To add or edit exercises, update `src/data/exercises.js`: each entry needs `id`, `name`, `category`, `cues` (array of strings), and either `defaultReps` or `defaultSeconds`; add `side: true` for unilateral exercises.

---

## Browser support

Modern browsers with ES module and typical React/Vite support (Chrome, Firefox, Safari, Edge). Best viewed on mobile (max-width 430px).

---

## License

MIT.
