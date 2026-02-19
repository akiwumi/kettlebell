# AI Assistant – Feature documentation

The AI Assistant provides **local, privacy-first insights** derived from your workout logs, body metrics, schedule, and profile. No data is sent to any external server; all analysis runs in your browser.

---

## What it does

- **Workout consistency** – Analyzes sessions per week over the last 4 weeks and suggests whether to maintain or increase frequency.
- **Volume trend** – Estimates total training volume (sets × reps × weight) from recent workouts and reports if it’s trending up or down.
- **Goal progress** – Compares current weight to your target (from Profile) and body metrics history, with a simple %-to-goal view.
- **Streak & adherence** – Computes current streak and adherence rate vs your planned training days per week.
- **Exercise variety** – Looks at category distribution (hinge, squat, press, pull, etc.) in recent workouts and suggests adding underused patterns.
- **Next best action** – Suggests one concrete step: e.g. start a session, log body metrics, or turn on reminders.

---

## Where to find it

- **Home** – “Your dashboard” section: **AI insights** card (🤖). Tapping it opens the full AI Assistant page. The card shows the current “top” insight (next action or streak).
- **Menu** – Open the hamburger menu → **🤖 AI Assistant** under Main.
- **URL** – `/ai-assistant`.

---

## Data sources (all local)

| Source | Used for |
|--------|----------|
| `trackingStorage`: workouts, body metrics, PRs | Consistency, volume, goal progress, streak, variety, next action |
| `scheduleStorage`: schedule & reminders | Next action (e.g. suggest enabling reminders) |
| `profileStorage`: profile (target weight, training days/week) | Goal progress, adherence, next action |
| `exercises.js` | Mapping exercise IDs to categories for variety |

---

## Privacy and limits

- **No API calls** – All logic lives in `src/services/aiService.js` and runs in the client.
- **No telemetry** – Insights are not sent anywhere.
- **Deterministic** – Same data always produces the same insights; no external AI model.

For full technical details, see **AI_INTEGRATION_SUMMARY.md**. For a short user guide, see **AI_QUICKSTART.md**.
