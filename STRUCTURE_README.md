# Kettlebell Gym — Application Architecture (Structured Reference)

This document consolidates all project README and documentation into a single, systematic view of the application architecture. It is the single source for understanding the full structure of the app.

---

## 1. Overview

| Aspect | Description |
|--------|-------------|
| **Product** | Mobile-first web app for kettlebell workouts: dashboard, custom and pre-curated routines, work/countdown timer sessions with per-exercise media, progression tracking, and exercise library. |
| **Stack** | Frontend-only: **Vite**, **React 18**, **React Router 6**. Optional **Supabase** for session history. No separate backend server. |
| **Design** | Light fitness theme, orange/indigo accents, glass panels, max-width 430px (mobile-first). Design tokens in `src/index.css`. |
| **Browser** | Modern browsers (Chrome, Firefox, Safari, Edge). Best viewed on mobile. |

### Source documentation (consolidated here)

| File | Purpose |
|------|---------|
| README.md | Main project structure, features, changelog |
| SETUP.md | Install, optional env, run, build, troubleshooting |
| FEATURES.md | Feature list and component overview |
| DEPLOY.md | Deployment, env vars, hosting (Vercel, Netlify, etc.) |
| AUDIO_IMPLEMENTATION_GUIDE.md | Coach voice and countdown beep implementation |
| AUDIO_TESTING.md | Manual test checklist for audio |
| AI_FEATURES.md | AI Assistant feature overview |
| AI_INTEGRATION_SUMMARY.md | AI technical summary and file list |
| AI_QUICKSTART.md | AI Assistant user guide |
| EXERCISE.md | Exercise list and IDs for media naming |
| design.md | Design system and CSS tokens |
| public/exercise-media/README.md | Session media naming and layout |
| public/registration/README.md | User data table and profile photos |

---

## 2. Entry and bootstrap

| Layer | File | Role |
|-------|------|------|
| HTML | `index.html` | Entry; loads `src/main.jsx`. Favicon: `/exercise-media/images/logos/kettlebell_logo_icon_col.png`. |
| Mount | `src/main.jsx` | Mounts React app with `<App />`. |
| Router | `src/App.jsx` | React Router; defines all routes; wraps routes in `<AppLayout />`. Renders **Landing** overlay (first screen); tap dismisses with dissolve to reveal app. State: `landingDismissed`. |
| First screen | `src/components/Landing.jsx` | Full-screen overlay: Kettlebell Mastery logo, 10-word tagline, “Tap screen to continue”. White background; dissolve to Home on tap. |

---

## 3. Shell and layout

### AppLayout (global shell)

| Element | Description |
|---------|-------------|
| **Top header** | Fixed, transparent; horizontal Kettlebell Mastery logo (`KETTLEBELL_HEADER_LOGO_URL`), 44px height, centered. |
| **Main** | Content area fits between header and bottom nav; no page scroll. Height `100dvh`; padding for header and nav. |
| **mainContent** | Wraps `<Outlet />`; flex, `overflow-y: auto` for pages that need scroll (e.g. Dashboard, Progress). |
| **Background** | Fixed `mainBg` (image) and `mainOverlay` (dark overlay) behind content. |
| **BottomNav** | Fixed bottom bar: Home, Profile, Data, Exercises, Menu. |
| **MenuDrawer** | Slide-up drawer from Menu; sections: Main, Progress & charts, Summary dashboard, Data & tracking, Schedule, Community & more. Centered 60×60 kettlebell icon in header. |

### Layout (page card)

- **Role:** Max-width glass panel, centred content; used by most pages.
- **fillViewport** (default `true`): Card fills space between header and nav; content scrolls inside card. **Library** uses `fillViewport={false}` so page scrolls normally.
- **Home** uses `className={styles.homeCard}` for tighter padding and `overflow: hidden` so content fits without scrolling.

---

## 4. Routes and page components

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Dashboard: welcome, profile picture, 2×2 cards (Progress, Data, Shared, AI insights), “Choose routine”, Exercise library link. Content fits in card without scroll. |
| `/ai-assistant` | AIAssistant | Local AI insights: 6 analyses (consistency, volume, goal, streak, variety, next action). Entry from Home card and Menu. |
| `/routine` | RoutinePage | Tabs: Pre-curated, My routines, Build your own → timer setup. |
| `/timer-setup` | TimerSetup | Scroll pickers: work (sec), rounds; exercise list from routine or today’s rotation; Start session. |
| `/session` | Session | Live workout: Work → 20s “Next in” countdown → next exercise. Per-exercise media; coach voice and countdown beep; timer at bottom. |
| `/dashboard` | Dashboard | Summary: streak, workouts, goal %, adherence, achievements, milestones. |
| `/progress` | Progress | Charts: weight, measurements, volume, heat map, strength per exercise, goal meter. |
| `/schedule` | Schedule | Workout/rest days, deload, reminders. |
| `/community` | Community | Share with friends; placeholders for challenges/leaderboards. |
| `/profile` | Profile | Full profile: photo, name, age, goals, equipment, coach voice (Off/Female/Male), etc. |
| `/library` | Library | Exercise library; category filter; expandable cues; `fillViewport={false}`. |
| `/data` | DataLayout + DataHome | Data shell with tabs; overview cards. |
| `/data/workouts` | WorkoutLog | Log workout: date, duration, exercises, RPE, energy, PRs. |
| `/data/history` | WorkoutHistory | Full table of all logged workouts. |
| `/data/stats` | WeeklyMonthlyStats | Workouts, time, volume, favorites. |
| `/data/body` | BodyMetrics | Weight, measurements, body fat, progress photo. |
| `/data/performance` | PerformanceMetrics | PRs log, volume over time. |

---

## 5. Component hierarchy (by role)

### Layout and navigation

| Component | Purpose |
|-----------|---------|
| AppLayout | Shell: header, main, BottomNav, MenuDrawer. |
| BottomNav | Home (kettlebell icon), Profile, Data, Exercises, Menu. |
| MenuDrawer | Sections and links; centered logo in header. |
| Landing | First screen; logo, tagline, “Tap screen to continue”. |
| Layout | Page wrapper; fillViewport option. |
| PageHeader | Title + optional subtitle. |
| BackLink | “← Back” link. |

### Session flow

| Component | Purpose |
|-----------|---------|
| Session | Phases (work, countdown), timer, media, coach voice, controls. |
| TimerDisplay | Phase (Work / Next in); during “Next in”, numeric countdown only for last 10 s (10…1), first 10 s show “—”. |
| SessionProgress | “Round X / Y · Exercise A / B”. |
| SessionComplete | End summary and link home. |
| CueList | Up to 3 form cues for current exercise. |

### Shared UI

| Component | Purpose |
|-----------|---------|
| Button | Primary/secondary/glass; supports `as={Link}`. |
| ExerciseCard | Card: name, reps/seconds, “each side”. |
| ExerciseListItem | List row with expandable cues. |
| FilterBar | Category filter (All, Hinge, Squat, …). |
| ShareWithFriends | Progression/exercise data/name + Share. |
| ScrollPicker | Mobile scroll picker (work sec, rounds). |
| AIAssistant / AIInsightCard | AI page and insight cards. |

### Data section

| Component | Purpose |
|-----------|---------|
| DataLayout | Tabs: Overview, Workout log, History, Weekly/Monthly, Body, Performance. |
| DataHome, WorkoutLog, WorkoutHistory, WeeklyMonthlyStats, BodyMetrics, PerformanceMetrics | Data sub-pages. |

---

## 6. Data layer: lib, services, and data

### Constants and assets

| File | Purpose |
|------|---------|
| `src/lib/constants.js` | `KETTLEBELL_ICON_URL`, `KETTLEBELL_HEADER_LOGO_URL`. |

### Exercises

| File | Purpose |
|------|---------|
| `src/data/exercises.js` | 30 exercises: `id`, `name`, `category`, `cues[]`, `defaultReps` or `defaultSeconds`, optional `side: true`. Categories: hinge, squat, press, pull, carry, mobility, compound, core. |

### Core libs

| File | Purpose |
|------|---------|
| `dailyRotation.js` | `getDailyExercises(date, count)`, `getDailyExerciseIds`, `isInTodayRotation`, `getExercisesByCategory`. Date-based seeded shuffle. |
| `routines.js` | Curated routines + user routines API: `getRoutines`, `saveUserRoutine`, `deleteUserRoutine`, `getExercisesByIds`. |
| `routineDatabase.js` | IndexedDB `KettlebellUserRoutines`, store `routines`. getRoutines, saveRoutine, deleteRoutine; migration from localStorage. |
| `trackingStorage.js` | Workouts, body metrics, PRs (localStorage): getWorkouts, saveWorkout, getBodyMetrics, saveBodyMetric, getPRs, savePR. |
| `scheduleStorage.js` | Schedule and reminders (localStorage): getSchedule, saveSchedule. |
| `profileStorage.js` | loadProfile, getDisplayName, getPhotoUrl, getCoachVoice (off/female/male). |
| `coachVoice.js` | speak, speakNextExercise, speakSessionStart, speakSessionComplete, playCountdownBeep, unlockAudio, preloadVoices. Web Speech API + Web Audio API; ignores `interrupted` in onerror. |
| `exerciseMedia.js` | getExerciseMedia(id) → video/image URLs under `public/exercise-media/`; optional filename overrides. |
| `shareData.js` | buildShareText, shareOrCopy (Web Share API or clipboard). |
| `registrationData.js` | getAllUserData() — export profile, workoutHistory, bodyMetrics, prs, schedule, userRoutines. |
| `supabase.js` | Supabase client (only when env vars set). |

### Services

| File | Purpose |
|------|---------|
| `sessionService.js` | saveSession, getRecentSessions (Supabase workout_sessions). |
| `aiService.js` | Local AI: 6 analyses; getAllInsights(), getTopInsight(). |

---

## 7. Storage and persistence

| Store | Key / DB | Content |
|-------|----------|---------|
| localStorage | `kettlebell-profile` | Profile (name, photo base64, goals, coach voice, etc.). |
| localStorage | `kettlebell-workouts` | Workout log entries. |
| localStorage | `kettlebell-body-metrics` | Body metrics history. |
| localStorage | `kettlebell-prs` | Personal records. |
| localStorage | `kettlebell-schedule` | Schedule and reminders. |
| IndexedDB | `KettlebellUserRoutines`, store `routines` | User-curated routines: `{ id, name, exerciseIds, createdAt }`. |
| Supabase (optional) | `workout_sessions` | Completed timer sessions. |

Schema and export shape: `public/registration/user-data.json`. Export API: `getAllUserData()` in `registrationData.js`.

---

## 8. Features (by area)

### Landing

- Full-screen white overlay on app open; Kettlebell Mastery logo, tagline, “Tap screen to continue”. Dissolve to Home on tap.

### Home

- Welcome, profile picture, 2×2 dashboard cards (Progression, Data & logs, Shared by friends, AI insights), “Choose routine & start workout”, Exercise library. Content fits in card without scroll.

### Routines

- Pre-curated (Today’s rotation, Quick 6, Full body, Strength, Cardio), My routines (IndexedDB), Build your own. Select or build → timer setup → Start session.

### Timer setup

- Work (5–120 s) and Rounds (1–10) via ScrollPicker; exercise list from routine or today’s rotation; Start session.

### Session (workout)

- Phases: Work → 20s “Next in” countdown → next exercise (or next round / done). Timer at bottom; frosted UI. Coach voice (if on): “Let’s go! Starting with…”, “Next up: … Get ready.”, beep last 10 s (higher pitch last 3). Per-exercise video/image background during work only. TimerDisplay shows numeric countdown only for last 10 s of “Next in” (10…1). Pause/Start, Quit.

### Progress & dashboard

- Charts: weight, measurements, volume, heat map, strength per exercise, goal meter. Summary dashboard: streak, goal %, adherence, achievements.

### Data & tracking

- Workout log, history table, weekly/monthly stats, body metrics, performance (PRs). Stored in localStorage (and optional Supabase for sessions).

### Schedule & reminders

- Workout/rest days, deload, reminders (workout, weigh-in, measurements, photos). localStorage.

### Profile

- Name, photo (base64), age, goals, equipment, **Coach voice** (Off / Female / Male), etc. localStorage.

### Exercise library

- All 30 exercises; category filter; expand for cues; “Today” badge. Library uses `fillViewport={false}`.

### AI Assistant

- Local-only insights: consistency, volume, goal, streak, variety, next action. Data from workouts, body metrics, schedule, profile. No external API. Route `/ai-assistant`; entry from Home card and Menu.

---

## 9. Audio system

| Part | File | Role |
|------|------|------|
| Engine | `src/lib/coachVoice.js` | Speech (Web Speech API), countdown beep (Web Audio API), unlockAudio. |
| Preference | `src/lib/profileStorage.js` | getCoachVoice (off/female/male). |
| UI | `src/components/Profile.jsx` | Coach voice dropdown. |
| Integration | `src/components/Session.jsx` | unlockAudio on first tap; speakSessionStart, speakNextExercise, playCountdownBeep (last 10 s), speakSessionComplete. |

- **Unlock:** Must call `unlockAudio()` from a user gesture (e.g. first tap in session) for iOS/Safari.
- **Beep:** Last 10 s of “Next in”; higher pitch for last 3 s.
- **Testing:** See AUDIO_TESTING.md for manual checklist.

---

## 10. AI Assistant (technical)

- **Engine:** `src/services/aiService.js`. Six deterministic analyses; no external API.
- **Components:** AIAssistant.jsx (page), AIInsightCard.jsx (card).
- **Data:** trackingStorage (workouts, body, PRs), scheduleStorage, profileStorage, exercises.js.
- **Exports:** getAllInsights(), getTopInsight().
- **Algorithms:** Workout consistency, volume trend, goal progress, streak & adherence, exercise variety, next best action.
- **Docs:** AI_FEATURES.md, AI_INTEGRATION_SUMMARY.md, AI_QUICKSTART.md.

---

## 11. Exercise data and media

### Exercise IDs (for media filenames)

From `src/data/exercises.js` and EXERCISE.md. Use as `images/<id>.jpg` or `videos/<id>.mp4`:

`swing-2h`, `swing-1h`, `goblet-squat`, `tgu`, `clean`, `snatch`, `press`, `push-press`, `row`, `deadlift-2h`, `deadlift-1h`, `front-squat`, `halo`, `windmill`, `figure-8`, `around-world`, `thruster`, `clean-squat-press`, `single-leg-deadlift`, `lunge`, `cossack`, `bottoms-up-press`, `bent-over-row`, `high-pull`, `suitcase-carry`, `rack-walk`, `farmers-walk`, `plank-hold`, `dead-stop-swing`, `alternating-swings`

### Public assets

| Path | Purpose |
|------|---------|
| `public/exercise-media/images/` | `<exercise-id>.jpg` or `.webp` for session background. |
| `public/exercise-media/images/logos/` | `kettlebell_mastery_logo.png` (Landing), `kettlebell_mastery_logo_horizontal.png` (header), `kettlebell_logo_icon_col.png` (nav, menu, favicon). |
| `public/exercise-media/videos/` | `<exercise-id>.mp4`; override in `exerciseMedia.js` if needed (e.g. `deadlift-2h` → `Two-Hand-Deadlift.mp4`). |

Video preferred when present; muted, loop; fallback to image on error.

---

## 12. Registration and user data schema

- **Schema:** `public/registration/user-data.json` — profile, workoutHistory, bodyMetrics, prs, schedule, userRoutines, sessionHistory.
- **Profile photos:** `public/registration/profile-photos/` for future backend; app currently stores photo as base64 in profile.
- **Export:** `getAllUserData()` in `src/lib/registrationData.js` returns data in table shape.

---

## 13. Configuration and scripts

### Scripts (run from kettlebell-app)

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies. |
| `npm run dev` | Vite dev server (e.g. http://localhost:5173). |
| `npm run build` | Production build → `dist/`. |
| `npm run preview` | Serve `dist/` locally. |

### Environment variables (optional)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (build time). |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (build time). |

Copy `.env.example` to `.env`. Required only for Supabase session persistence. See SETUP.md and DEPLOY.md.

### Deployment

- Build: `npm run build` → `dist/`. Static host; set env vars at build time if using Supabase.
- Hosting: Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc. Publish directory: `dist`. SPA fallback to `index.html` for client routes. See DEPLOY.md.

---

## 14. Design and development notes

- **Design tokens:** `src/index.css` (`:root`): surfaces, text, accents, borders, shadows, radii. See design.md.
- **Styling:** Global tokens in index.css; per-component `*.module.css`. Mobile-first, max-width 430px.
- **Session state:** Exercises and intervals from React Router `location.state` (TimerSetup → Session). Phase transitions use “just hit zero” ref.
- **Coach voice:** unlockAudio from user gesture; onerror ignores `interrupted`.
- **Data locations:** Profile, workouts, body, PRs, schedule → localStorage. User routines → IndexedDB. Optional sessions → Supabase.

---

## 15. Full file tree

```
kettlebell-app/
├── README.md
├── SETUP.md
├── FEATURES.md
├── DEPLOY.md
├── structure_readme.md          ← this file
├── AUDIO_IMPLEMENTATION_GUIDE.md
├── AUDIO_TESTING.md
├── AI_FEATURES.md
├── AI_INTEGRATION_SUMMARY.md
├── AI_QUICKSTART.md
├── EXERCISE.md
├── design.md
├── supabase-schema.sql
├── .env.example
├── package.json
├── vite.config.js
├── index.html
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

## 16. Changelog (condensed)

| Change |
|--------|
| Session timer: countdown last 10 s only in “Next in”; first 10 s show “—”. |
| Header: horizontal Kettlebell Mastery logo (44px); Home card fits without scroll (2×2 grid, compact). |
| Transparent header; main fits between header and nav; Layout fillViewport; Library fillViewport={false}. |
| Global top header; icon 60×60 in menu drawer. |
| Landing page: logo, tagline, “Tap screen to continue”; dissolve to Home. |
| Coach voice: ignore “interrupted” in onerror. |
| Audio: coach voice + countdown beep; Profile dropdown Off/Female/Male. |
| Session UI: timer at bottom, frosted; video only during work. |
| Timer setup: scroll pickers (work, rounds); rest removed. |
| AI Assistant: 6 local insights at `/ai-assistant`. |

---

*This document is generated from README.md, SETUP.md, FEATURES.md, DEPLOY.md, AUDIO_*.md, AI_*.md, EXERCISE.md, design.md, and public READMEs. For detailed steps (setup, deploy, audio tests), refer to the individual files.*
