# Exercises in the app

All **30** kettlebell exercises are defined in `src/data/exercises.js`. Each has an `id` (used for media filenames), `name`, `category`, form cues, and default reps or seconds. Unilateral exercises are marked with **each side**.

---

## Categories

| ID | Label |
|----|--------|
| hinge | Hinge |
| squat | Squat |
| press | Press |
| pull | Pull |
| carry | Carry |
| mobility | Mobility |
| compound | Compound |
| core | Core |

---

## Full exercise list

| # | ID | Name | Category | Default | Each side |
|---|----|------|----------|---------|-----------|
| 1 | `swing-2h` | Two-Hand Swing | hinge | 10 reps | — |
| 2 | `swing-1h` | One-Hand Swing | hinge | 10 reps | ✓ |
| 3 | `goblet-squat` | Goblet Squat | squat | 8 reps | — |
| 4 | `tgu` | Turkish Get-Up | carry | 1 rep | ✓ |
| 5 | `clean` | Clean | pull | 8 reps | ✓ |
| 6 | `snatch` | Snatch | pull | 8 reps | ✓ |
| 7 | `press` | Strict Press | press | 6 reps | ✓ |
| 8 | `push-press` | Push Press | press | 6 reps | ✓ |
| 9 | `row` | Single-Arm Row | pull | 8 reps | ✓ |
| 10 | `deadlift-2h` | Two-Hand Deadlift | hinge | 8 reps | — |
| 11 | `deadlift-1h` | One-Hand Deadlift | hinge | 8 reps | ✓ |
| 12 | `front-squat` | Front Rack Squat | squat | 6 reps | ✓ |
| 13 | `halo` | Goblet Halo | mobility | 6 reps | — |
| 14 | `windmill` | Windmill | mobility | 5 reps | ✓ |
| 15 | `figure-8` | Figure-8 Pass | mobility | 10 reps | — |
| 16 | `around-world` | Around the World | mobility | 6 reps | — |
| 17 | `thruster` | Thruster | compound | 6 reps | ✓ |
| 18 | `clean-squat-press` | Clean + Squat + Press | compound | 5 reps | ✓ |
| 19 | `single-leg-deadlift` | Single-Leg Deadlift | hinge | 6 reps | ✓ |
| 20 | `lunge` | Goblet Lunge | squat | 8 reps | ✓ |
| 21 | `cossack` | Cossack Squat | squat | 6 reps | — |
| 22 | `bottoms-up-press` | Bottoms-Up Press | press | 5 reps | ✓ |
| 23 | `bent-over-row` | Bent-Over Row | pull | 8 reps | ✓ |
| 24 | `high-pull` | High Pull | pull | 8 reps | ✓ |
| 25 | `suitcase-carry` | Suitcase Carry | carry | 30 sec | ✓ |
| 26 | `rack-walk` | Rack Walk | carry | 30 sec | — |
| 27 | `farmers-walk` | Farmers Walk | carry | 30 sec | — |
| 28 | `plank-hold` | Plank (optional with bell) | core | 30 sec | — |
| 29 | `dead-stop-swing` | Dead-Stop Swing | hinge | 8 reps | — |
| 30 | `alternating-swings` | Alternating Swings | hinge | 10 reps | — |

---

## Exercise IDs (for media files)

Use these exact IDs as filenames in `public/exercise-media/images/` and `public/exercise-media/videos/` (e.g. `swing-2h.jpg`, `tgu.mp4`):

```
swing-2h
swing-1h
goblet-squat
tgu
clean
snatch
press
push-press
row
deadlift-2h
deadlift-1h
front-squat
halo
windmill
figure-8
around-world
thruster
clean-squat-press
single-leg-deadlift
lunge
cossack
bottoms-up-press
bent-over-row
high-pull
suitcase-carry
rack-walk
farmers-walk
plank-hold
dead-stop-swing
alternating-swings
```

---

## By category

- **Hinge (7):** Two-Hand Swing, One-Hand Swing, Two-Hand Deadlift, One-Hand Deadlift, Single-Leg Deadlift, Dead-Stop Swing, Alternating Swings
- **Squat (4):** Goblet Squat, Front Rack Squat, Goblet Lunge, Cossack Squat
- **Press (3):** Strict Press, Push Press, Bottoms-Up Press
- **Pull (5):** Clean, Snatch, Single-Arm Row, Bent-Over Row, High Pull
- **Carry (4):** Turkish Get-Up, Suitcase Carry, Rack Walk, Farmers Walk
- **Mobility (4):** Goblet Halo, Windmill, Figure-8 Pass, Around the World
- **Compound (2):** Thruster, Clean + Squat + Press
- **Core (1):** Plank (optional with bell)
