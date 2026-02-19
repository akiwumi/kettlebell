# AI Integration – Technical summary

## Overview

The “AI” Assistant is a **client-only analysis layer** that runs six deterministic algorithms over the app’s existing data (workouts, body metrics, PRs, schedule, profile). There is no external AI API; the name reflects insight-style outputs (consistency, volume, goals, streak, variety, next action).

## Files

| File | Purpose |
|------|---------|
| `src/services/aiService.js` | AI engine: 6 analysis functions + `getAllInsights()`, `getTopInsight()` |
| `src/components/AIAssistant.jsx` | Full AI page: header, intro, refresh button, list of insights |
| `src/components/AIAssistant.module.css` | Page layout and button styling |
| `src/components/AIInsightCard.jsx` | Reusable card: title, summary, metric, optional CTA link |
| `src/components/AIInsightCard.module.css` | Card styling (glass panel, hover) |

## Routes and navigation

- **Route:** `/ai-assistant` → `AIAssistant` (in `App.jsx`).
- **Menu:** MenuDrawer “Main” section includes “🤖 AI Assistant” linking to `/ai-assistant`.
- **Home:** “Your dashboard” has a fourth card “AI insights” (🤖) linking to `/ai-assistant`; card subtitle shows `getTopInsight().summary`.

## Data flow

1. **AIAssistant** calls `getAllInsights()` from `aiService` (in a `useMemo` keyed by a refresh counter).
2. **Home** calls `getTopInsight()` once to show one line on the dashboard card.
3. **aiService** reads from:
   - `getWorkouts()`, `getBodyMetrics()`, `getPRs()` (`trackingStorage`)
   - `getSchedule()` (`scheduleStorage`)
   - `loadProfile()` (`profileStorage`)
   - `exercises` (`data/exercises.js`) for category labels and ID → category mapping.

## Algorithms (6)

1. **analyzeWorkoutConsistency()** – Last 4 weeks’ workout count per week; average and trend; message (e.g. “consistent” vs “aim for 2–3 sessions”).
2. **analyzeVolumeTrend()** – Volume = sum of (sets × reps × weight) per workout; compare last 5 vs previous 5; “up” / “down” message.
3. **analyzeGoalProgress()** – Profile target weight vs latest body metric (or profile weight); % toward goal; encouragement message.
4. **analyzeStreakAndAdherence()** – Consecutive days with at least one workout; adherence % (this month’s workouts / planned).
5. **analyzeExerciseVariety()** – Category counts from recent workout exercises; suggest adding underused categories.
6. **analyzeNextBestAction()** – Single recommendation: e.g. “log first workout”, “schedule a session”, “log body metrics”, “set reminders”, or “you’re on track”.

## Exports

- `getAllInsights()` – Array of 6 insight objects `{ id, type, title, summary, metric?, suggestion?, link? }`.
- `getTopInsight()` – One object for the dashboard card (prefers streak if ≥ 3 days, else next action).

## Dependencies

- React (useMemo, useState)
- react-router-dom (Link in AIInsightCard, route in App)
- Existing libs: trackingStorage, scheduleStorage, profileStorage
- Existing data: exercises.js

No new npm packages. No environment variables. Production-ready as-is.
