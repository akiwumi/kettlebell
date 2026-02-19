# Registration – user data table and profile photos

This folder holds the **user data table** (all user and exercise history) and, with a backend, uploaded **profile photos**.

## User data table

- **File:** `user-data.json`
- **Purpose:** Schema for all app data so everything corresponds to app options:
  - **profile** – Name, photo, weight, goals, equipment, preferences (localStorage: `kettlebell-profile`).
  - **workoutHistory** – Full exercise history: every logged workout with date, duration, exercises (sets/reps/weight), RPE, energy, modifications, skipped, PRs (localStorage: `kettlebell-workouts`).
  - **bodyMetrics** – Weight and measurements over time (localStorage: `kettlebell-body-metrics`).
  - **prs** – Personal records (localStorage: `kettlebell-prs`).
  - **schedule** – Workout days, rest days, reminders, deload (localStorage: `kettlebell-schedule`).
  - **userRoutines** – User-curated routines in the app’s **routine database** (IndexedDB: `KettlebellUserRoutines`, store: `routines`). Shown under **My routines** tab.
  - **sessionHistory** – Completed timer sessions (Supabase or app).
- The app stores live data in localStorage. Use **Data → Workout history** in the app to see the full workout table. To export all user data in this shape, use `getAllUserData()` from `src/lib/registrationData.js`.

## Profile photos

- **Folder:** `profile-photos/`
- **Purpose:** With a backend, uploaded profile pictures would be saved here (e.g. `profile-photos/{userId}.jpg`). The app currently stores the profile picture as base64 in the profile (localStorage) so it persists without a server.

## Adding a backend

To store data and photos in this folder at runtime you would:

1. Add an API (e.g. Node/Express or Supabase Storage) that writes to `registration/profile-photos/` and reads/writes `user-data.json` (or a real database with the same schema).
2. Update the app to upload the photo and user data to that API instead of (or in addition to) localStorage.
