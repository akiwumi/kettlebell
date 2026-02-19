# Feature Spec: Unilateral Exercise — Swap Sides Logic

## Overview

Some kettlebell exercises are **unilateral** (performed with one arm or one leg at a time). For these exercises, the app must automatically prompt the user to switch to the opposite limb once the routine countdown finishes, then restart the timer so they complete the same work on both sides.

---

## Core Concept

```
[User selects a unilateral exercise]
        ↓
[Timer counts down from set duration]
        ↓
[Timer hits 0:00 — Side 1 complete]
        ↓
[Coach audio plays: "And now, swap sides"]
        ↓
[Timer resets to the ORIGINAL start duration]
        ↓
[Timer counts down again — Side 2]
        ↓
[Timer hits 0:00 — Exercise complete]
        ↓
[Move to next exercise in the workout]
```

---

## Definitions

| Term | Meaning |
|------|---------|
| **Unilateral exercise** | Any exercise performed on one side of the body at a time (one arm OR one leg) |
| **Bilateral exercise** | Any exercise using both arms/legs simultaneously (e.g. two-handed kettlebell swing) |
| **Routine duration** | The countdown time the user sets for each exercise |
| **Swap prompt** | Audio cue + visual indicator telling the user to switch sides |

---

## Data Model

Each exercise in the database needs a boolean flag:

```
exercise {
  id: string
  name: string
  description: string
  isUnilateral: boolean   // <-- KEY FIELD
  ...
}
```

### Examples of `isUnilateral` values

| Exercise | isUnilateral |
|----------|:------------:|
| Single-arm kettlebell press | `true` |
| Single-arm kettlebell row | `true` |
| Single-arm kettlebell snatch | `true` |
| Single-leg kettlebell deadlift | `true` |
| Turkish get-up | `true` |
| Kettlebell clean (one arm) | `true` |
| Two-handed kettlebell swing | `false` |
| Goblet squat | `false` |
| Two-handed kettlebell deadlift | `false` |
| Kettlebell halo | `false` |

---

## Timer Logic (Pseudocode)

```
function startExerciseTimer(exercise, durationSeconds):

    if exercise.isUnilateral:
        currentSide = 1
        totalSides = 2
    else:
        currentSide = 1
        totalSides = 1

    startCountdown(durationSeconds)

    onCountdownComplete():
        if currentSide < totalSides:
            // --- SWAP SIDES ---
            playAudio("and_now_swap_sides")    // coach voice clip
            showSwapSidesOverlay()              // visual indicator on screen
            currentSide = currentSide + 1
            resetTimer(durationSeconds)         // reset to ORIGINAL duration
            startCountdown(durationSeconds)     // begin Side 2
        else:
            // --- EXERCISE COMPLETE ---
            playAudio("exercise_complete")
            moveToNextExercise()
```

---

## UI Requirements

### During countdown (both sides)
- Display the countdown timer prominently
- Show which side the user is on: **"Side 1 of 2"** or **"Side 2 of 2"**
- For bilateral exercises, do NOT show side indicators

### At the swap point (when Side 1 timer hits zero)
1. **Audio:** Play coach voice saying **"And now, swap sides"**
2. **Visual:** Show a brief swap-sides overlay/animation (e.g. arrows pointing left ↔ right, or a "SWAP SIDES" banner)
3. **Timer reset:** After a short pause (1–2 seconds for the user to transition), reset the timer back to the **original duration** and begin counting down automatically
4. **Side indicator updates:** Change from "Side 1 of 2" → "Side 2 of 2"

### When Side 2 timer hits zero
- Treat the exercise as fully complete
- Transition to the next exercise in the workout sequence

---

## Audio Assets Needed

| Trigger | Audio clip | Description |
|---------|-----------|-------------|
| Side 1 complete | `swap_sides.mp3` | Coach voice: "And now, swap sides" |
| Exercise complete | `exercise_complete.mp3` | Coach voice confirming exercise is done |

---

## Edge Cases to Handle

1. **User pauses mid-exercise:** Timer pauses. On resume, continue from where they left off on the current side. Do NOT reset or skip the swap.

2. **User skips exercise:** If the user skips during Side 1, skip the entire exercise (both sides). Do NOT play the swap prompt.

3. **User skips Side 2 only:** If the user taps skip after the swap prompt during Side 2, move to the next exercise.

4. **Rest periods between sides:** The 1–2 second pause at the swap point is just for the audio cue to play — it is NOT a configurable rest period. The timer resets and starts immediately after the swap audio.

5. **Workout summary/stats:** When logging completed exercises, record that both sides were completed (or only one side if the user skipped). Example: "Single-arm press — Left ✓ Right ✓" vs "Single-arm press — Left ✓ Right ✗".

---

## Implementation Checklist

- [ ] Add `isUnilateral` boolean field to the exercise data model
- [ ] Tag all existing exercises with the correct `isUnilateral` value
- [ ] Update the timer component to support a two-phase countdown for unilateral exercises
- [ ] Add side indicator UI ("Side 1 of 2" / "Side 2 of 2")
- [ ] Record/source the "And now, swap sides" coach audio clip
- [ ] Implement the swap-sides overlay/animation
- [ ] Add 1–2 second transition pause before Side 2 timer starts
- [ ] Timer resets to the ORIGINAL duration (not a different value)
- [ ] Handle pause, skip, and resume correctly across both sides
- [ ] Update workout summary to reflect per-side completion
- [ ] Test with both unilateral and bilateral exercises to confirm bilateral exercises are unaffected

---

## Summary

**The rule is simple:** If an exercise is one-handed or one-legged, the user does it twice — once per side. The coach announces the swap, the timer resets to the same duration, and the user completes the other side before moving on.
