# Feature list

Full feature list and component overview for the Kettlebell Gym app.

---

## Core features

### Daily rotation

- **Deterministic by date** – The same calendar day always shows the same 6 exercises. No account or login required.
- **Seeded shuffle** – Implemented in `src/lib/dailyRotation.js` using a date-based seed so the order is reproducible.
- **Configurable count** – Default is 6 exercises per day; the API supports other counts (e.g. for different programs).

### Timer setup

- **Today’s exercises** – List is fixed from the daily rotation; user cannot add/remove exercises here, only adjust timing.
- **Work interval** – Seconds per exercise (e.g. 30). Bounds typically 5–120 in the UI.
- **Rounds** – How many times to run through the full list (e.g. 3).
- **Start session** – Navigates to the session view and passes exercises + intervals via router state.

### Work / countdown session

- **Phases** – “Work” (exercise) then a 20s “Next in” countdown. After work finishes, the countdown runs; when it hits zero, the next exercise (or next round) begins.
- **Current exercise** – Name and up to 3 form cues shown during work.
- **Controls** – Start/Pause for the timer; Quit to leave and return home.
- **Progress** – “Round X / Y · Exercise Z / W” so the user knows where they are.
- **Completion** – When all rounds are done, the session complete screen is shown.

### Session complete

- **Summary** – e.g. “3 rounds × 6 exercises”.
- **Back to home** – Link to return to the main screen.
- **Persistence** – If Supabase is configured, the completed session is saved automatically (exercise IDs, work seconds, rounds, completion time).

---

## Exercise library

- **All 30 exercises** – Listed with name, default reps or seconds, and “each side” where applicable.
- **Categories** – Filter by: All, Hinge, Squat, Press, Pull, Carry, Mobility, Compound, Core.
- **Expand for cues** – Tap/click an exercise to expand and see full form cues.
- **“Today” badge** – Indicates when an exercise is in today’s rotation (same logic as home screen).

---

## Data and logic

### Exercises

- **Source** – `src/data/exercises.js`.
- **Shape** – Each exercise has: `id`, `name`, `category`, `cues` (array of strings), `defaultReps` or `defaultSeconds`, and optional `side: true`.
- **Categories** – hinge, squat, press, pull, carry, mobility, compound, core.

### Daily rotation

- **Module** – `src/lib/dailyRotation.js`.
- **Exports:**
  - `getDailyExercises(date, count)` – Returns `count` exercise objects for the given date.
  - `getDailyExerciseIds(date, count)` – Same but returns IDs only.
  - `isInTodayRotation(exerciseId, date, count)` – Whether an exercise is in that day’s set.
  - `getExercisesByCategory(categoryId)` – Filter exercises by category (or all if empty).

### Supabase (optional)

- **Client** – `src/lib/supabase.js`. Creates the Supabase client only if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set; otherwise the app runs without a backend.
- **Session service** – `src/services/sessionService.js`: `saveSession()`, `getRecentSessions()`. Used to persist completed sessions and, in the future, to display history.
- **Schema** – `supabase-schema.sql`: `workout_sessions` table with id, completed_at, exercise_ids, work_seconds, rest_seconds, rounds. RLS allows anonymous insert/select for simplicity.

---

## UI components (12)

Reusable building blocks used by the main screens:

| Component | Purpose |
|-----------|---------|
| **Layout** | Max-width container and padding for page content. |
| **BackLink** | “← Back” (or custom text) linking to home or a given path. |
| **Button** | Primary (filled) and secondary (outline); can render as `<button>` or `<Link>`. |
| **PageHeader** | Title and optional subtitle for a screen. |
| **ExerciseCard** | Compact row: exercise name, meta (reps/seconds, “each side”), optional “Today” badge. |
| **ExerciseListItem** | Expandable row used in the library: name, optional badge, expand to show meta + cues. |
| **FilterBar** | Pill-style buttons for filters (e.g. category); one option is “active”. |
| **CueList** | Renders a list of form cues; optional `maxItems` to show only the first N. |
| **TimerDisplay** | Phase label (Work / Next in), large countdown number, optional exercise name. |
| **SessionProgress** | Text line: “Round X / Y · Exercise Z / W”. |
| **SessionComplete** | “Session complete” message, summary (rounds × exercises), “Back to home” link. |

**Page-level components** (compose the above):

- **Home** – Today’s rotation (ExerciseCard list), “Start session” and “Exercise library” buttons.
- **TimerSetup** – Back link, header, today’s exercises list, work (sec) and rounds inputs, “Start session” button.
- **Session** – SessionProgress, TimerDisplay, CueList during work, Start/Pause and Quit; on finish, SessionComplete and optional save to Supabase.
- **Library** – Back link, header, FilterBar, list of ExerciseListItem.
- **AIAssistant** – Full page at `/ai-assistant`: 6 local insights (consistency, volume, goal, streak, variety, next action); refresh button; uses **AIInsightCard** for each insight. Accessible from Home dashboard card (🤖 AI insights) and Menu (🤖 AI Assistant).

---

## AI Assistant

- **Local only** – All analysis runs in the browser; no external API or telemetry.
- **Six analyses** – Workout consistency, volume trend, goal progress, streak & adherence, exercise variety, next best action.
- **Data sources** – Workouts, body metrics, PRs (trackingStorage); schedule (scheduleStorage); profile (profileStorage); exercises (category mapping).
- **Docs** – AI_FEATURES.md, AI_INTEGRATION_SUMMARY.md, AI_QUICKSTART.md, AI_STATUS.txt.

---

## Tech stack

- **React 18** – UI components and hooks.
- **React Router 6** – Routes: `/`, `/timer-setup`, `/session`, `/library`.
- **Vite 5** – Dev server, build, and preview.
- **CSS Modules** – Component-scoped styles (e.g. `*.module.css`).
- **Supabase** (optional) – Backend for `workout_sessions`; app is fully usable without it.

---

## Routes

| Path | Screen | Notes |
|------|--------|--------|
| `/` | Home | Today’s rotation, dashboard cards (Progress, Data, Shared, AI insights), main actions. |
| `/ai-assistant` | AI Assistant | Local insights: consistency, volume, goal, streak, variety, next action. |
| `/timer-setup` | Timer setup | Configure work (sec) and rounds, then start. |
| `/session` | Session | Timer and cues; state from router location. |
| `/library` | Library | All exercises, filters, expandable cues. |

All routes are client-side; the app is a single page. See **DEPLOY.md** for configuring the host to serve `index.html` for all paths (avoid 404 on refresh).

---

## Accessibility and UX

- **Timer** – Large, tabular-numeric countdown for quick reading; phase (Work / Next in) is clearly labeled.
- **Cues** – Short, actionable form cues during work; full list in the library for study.
- **Navigation** – Back links and primary/secondary buttons keep flows clear (home → setup → session → complete, or home → library).
- **No login required** – Daily rotation and sessions work offline-first; only session persistence uses Supabase when configured.
