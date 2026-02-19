# Audio Implementation Guide for Kettlebell Gym App

## Cursor Agent Instructions — Complete Audio System

This document provides exact, step-by-step instructions to implement **all audio features** in the Kettlebell Gym app: coach voice announcements, countdown beeps, and iOS/Safari audio unlocking.

---

## Architecture Overview

The audio system has **4 parts**:

| Part | File | What it does |
|------|------|-------------|
| 1. Coach Voice module | `src/lib/coachVoice.js` | Core audio engine — speech synthesis + beep generation |
| 2. Profile storage | `src/lib/profileStorage.js` | Stores/retrieves user's voice preference (off/female/male) |
| 3. Profile UI | `src/components/Profile.jsx` | Dropdown to choose coach voice |
| 4. Session integration | `src/components/Session.jsx` | Calls coach voice during workout phases |

---

## PART 1: Create `src/lib/coachVoice.js`

This is the **core audio engine**. Create this file from scratch.

```javascript
// src/lib/coachVoice.js
// Coach voice announcements (Web Speech API) and countdown beep (Web Audio API)

let audioCtx = null;
let audioUnlocked = false;

// ─── Audio Context ─────────────────────────────────────────────
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ─── Unlock Audio (MUST be called from a user gesture) ─────────
// iOS/Safari blocks audio until a user interaction triggers playback.
// Call this from the FIRST tap/click inside the Session component.
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    // Resume suspended context (Safari requirement)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play a silent buffer to fully unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    audioUnlocked = true;
    console.log('[CoachVoice] Audio unlocked');
  } catch (e) {
    console.warn('[CoachVoice] Audio unlock failed:', e);
  }
}

// ─── Beep (Web Audio API) ──────────────────────────────────────
// Plays a short sine-wave beep. Used for countdown in last 10s.
export function playCountdownBeep(frequency = 880, durationMs = 120) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    // Quick fade-out to avoid click
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('[CoachVoice] Beep failed:', e);
  }
}

// ─── Speech (Web Speech API) ───────────────────────────────────
// Returns a Promise that resolves when speech ends (or rejects on error).
function speakText(text, voicePreference = 'female') {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('[CoachVoice] SpeechSynthesis not supported');
      resolve();
      return;
    }

    // Cancel any queued speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to pick a voice matching the preference
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferFemale = voicePreference === 'female';
      // Heuristic: female voice names often contain these keywords
      const femaleHints = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'susan'];
      const maleHints = ['male', 'man', 'daniel', 'james', 'alex', 'fred', 'thomas', 'gordon', 'lee'];

      const hints = preferFemale ? femaleHints : maleHints;
      const match = voices.find(v => {
        const name = v.name.toLowerCase();
        return hints.some(h => name.includes(h)) && v.lang.startsWith('en');
      });

      if (match) {
        utterance.voice = match;
      } else {
        // Fallback: pick any English voice
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
    }

    utterance.onend = resolve;
    utterance.onerror = (e) => {
      console.warn('[CoachVoice] Speech error:', e);
      resolve(); // resolve anyway so session doesn't hang
    };

    window.speechSynthesis.speak(utterance);
  });
}

// ─── Public: speak wrapper ─────────────────────────────────────
export function speak(text, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  return speakText(text, voicePreference);
}

// ─── Public: announce next exercise ────────────────────────────
// Called at the START of the "Next in" countdown phase.
export function speakNextExercise(exerciseName, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  const text = `Next up: ${exerciseName}. Get ready.`;
  return speakText(text, voicePreference);
}

// ─── Public: announce session start ────────────────────────────
export function speakSessionStart(exerciseName, voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  const text = `Let's go! Starting with ${exerciseName}.`;
  return speakText(text, voicePreference);
}

// ─── Public: announce session complete ─────────────────────────
export function speakSessionComplete(voicePreference = 'female') {
  if (!voicePreference || voicePreference === 'off') return Promise.resolve();
  return speakText('Great work! Session complete.', voicePreference);
}

// ─── Preload voices ────────────────────────────────────────────
// Some browsers load voices asynchronously. Call early.
export function preloadVoices() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    // Chrome fires voiceschanged when voices are ready
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
```

---

## PART 2: Update `src/lib/profileStorage.js`

Add a `getCoachVoice()` helper that reads the coach voice preference from the profile.

### Find the existing file and ADD this export:

```javascript
// Add to src/lib/profileStorage.js

/**
 * Get the coach voice preference from the profile.
 * Returns 'off', 'female', or 'male'. Defaults to 'off'.
 */
export function getCoachVoice() {
  const profile = loadProfile();
  return profile?.coachVoice || 'off';
}
```

> **Note:** `loadProfile()` already exists in this file and reads from `localStorage('kettlebell-profile')`. You are just adding one new exported function. Do NOT replace the file.

---

## PART 3: Update `src/components/Profile.jsx`

Add a **Coach Voice** selector to the profile form.

### Step 3a: Find the Profile component's state initialization

Look for where profile state is loaded (e.g. `useState` or `useEffect` that calls `loadProfile()`). Make sure `coachVoice` is included in the profile state. It should already be in the profile object from localStorage, but if the form doesn't render it, you need to add the UI.

### Step 3b: Add the Coach Voice dropdown to the JSX

Find an appropriate place in the profile form (after "Equipment" or "Goals" section, or as its own section near the top). Add:

```jsx
{/* Coach Voice */}
<div className={styles.field}>
  <label htmlFor="coachVoice">Coach voice</label>
  <select
    id="coachVoice"
    value={profile.coachVoice || 'off'}
    onChange={(e) => setProfile({ ...profile, coachVoice: e.target.value })}
  >
    <option value="off">Off</option>
    <option value="female">Female</option>
    <option value="male">Male</option>
  </select>
</div>
```

### Step 3c: Ensure save persists `coachVoice`

Verify the save/update handler spreads the full profile object to localStorage. If it does `localStorage.setItem('kettlebell-profile', JSON.stringify(profile))`, then `coachVoice` is already included since it's part of the `profile` state object. No extra work needed.

---

## PART 4: Update `src/components/Session.jsx` (The Big One)

This is where all audio logic hooks into the workout timer. You need to:

1. Import audio functions
2. Unlock audio on first user tap
3. Announce exercises via coach voice
4. Play countdown beeps in last 10 seconds

### Step 4a: Add imports at the top of Session.jsx

```javascript
import {
  unlockAudio,
  playCountdownBeep,
  speakNextExercise,
  speakSessionStart,
  speakSessionComplete,
  preloadVoices
} from '../lib/coachVoice';
import { getCoachVoice } from '../lib/profileStorage';
```

### Step 4b: Add state/refs for audio

Inside the Session component, near the top where other state/refs are declared, add:

```javascript
const coachVoice = useRef(getCoachVoice());       // 'off' | 'female' | 'male'
const audioUnlockedRef = useRef(false);             // track if user has tapped
```

### Step 4c: Preload voices on mount

In the existing `useEffect` that runs on mount (or create one), add:

```javascript
useEffect(() => {
  preloadVoices();
}, []);
```

### Step 4d: Unlock audio on first user interaction

Add an `onClick` handler to the **outermost container** of the Session component:

```jsx
const handleSessionTap = () => {
  if (!audioUnlockedRef.current) {
    unlockAudio();
    audioUnlockedRef.current = true;
  }
};

// In JSX — wrap the session container:
<div className={styles.session} onClick={handleSessionTap}>
  {/* ... existing session content ... */}
</div>
```

> **Why:** iOS/Safari requires a user gesture before any audio plays. This ensures the first tap anywhere in the session screen unlocks the AudioContext.

### Step 4e: Announce the FIRST exercise when session starts

Find where the session auto-starts (it starts on mount per the README). After the session begins and the first exercise is set, call:

```javascript
// Inside the mount effect or wherever the first work phase begins:
if (coachVoice.current !== 'off') {
  speakSessionStart(exercises[0]?.name || 'first exercise', coachVoice.current);
}
```

### Step 4f: Announce next exercise at start of "Next in" countdown

Find the phase transition logic — specifically where the phase changes **from work to countdown** (the "Next in" phase). This is the critical integration point.

Look for code like:
```javascript
// pseudocode of what probably exists:
if (phase === 'work' && timeLeft <= 0) {
  // transition to countdown
  setPhase('countdown');
  setTimeLeft(20); // 20-second countdown
}
```

**Right after the phase switches to countdown**, add the voice announcement:

```javascript
// When entering "Next in" countdown phase:
if (coachVoice.current !== 'off') {
  // nextExercise = the exercise that will come AFTER the countdown
  const nextExerciseName = getNextExerciseName(); // your logic to determine the next exercise
  speakNextExercise(nextExerciseName, coachVoice.current);
}
```

> **Important:** `getNextExerciseName()` is a placeholder — replace it with whatever logic determines the next exercise in the queue. This might be `exercises[currentExerciseIndex + 1]?.name` or similar, depending on how Session.jsx tracks the current exercise.

### Step 4g: Play beep during last 10 seconds of countdown

Find the timer tick logic — this runs every second. Inside the countdown phase tick, add the beep:

```javascript
// Inside the interval/tick handler, when phase is 'countdown':
if (phase === 'countdown' && timeLeft <= 10 && timeLeft > 0) {
  if (coachVoice.current !== 'off') {
    // Higher pitch for the final 3 seconds
    const freq = timeLeft <= 3 ? 1200 : 880;
    playCountdownBeep(freq, 120);
  }
}
```

### Step 4h: Announce session complete

Find where `SessionComplete` is shown (phase === 'complete' or similar). Add:

```javascript
// When session finishes:
if (coachVoice.current !== 'off') {
  speakSessionComplete(coachVoice.current);
}
```

---

## PART 5: Timer Tick Integration — Detailed Pattern

Here's the **exact pattern** for how the audio calls fit into the timer logic. Adapt this to match Session.jsx's actual timer implementation:

```javascript
// This is the PATTERN — adapt variable names to match your actual code

useEffect(() => {
  if (paused || phase === 'complete') return;

  const interval = setInterval(() => {
    setTimeLeft(prev => {
      const next = prev - 1;

      // ── BEEP in last 10s of countdown ──
      if (phase === 'countdown' && next <= 10 && next > 0 && coachVoice.current !== 'off') {
        const freq = next <= 3 ? 1200 : 880;
        playCountdownBeep(freq, 120);
      }

      // ── TIME'S UP: transition ──
      if (next <= 0) {
        // Use a ref to prevent double-firing (as mentioned in README)
        if (justHitZeroRef.current) return 0;
        justHitZeroRef.current = true;

        if (phase === 'work') {
          // → Switch to countdown
          setPhase('countdown');
          
          // Announce next exercise
          if (coachVoice.current !== 'off') {
            const nextEx = exercises[currentExIdx + 1] || exercises[0]; // wrap or next
            speakNextExercise(nextEx.name, coachVoice.current);
          }
          
          return 20; // 20-second countdown
        }
        
        if (phase === 'countdown') {
          // → Move to next exercise work phase
          advanceToNextExercise(); // your existing logic
          setPhase('work');
          return workSeconds;
        }
      }

      justHitZeroRef.current = false;
      return next;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [phase, paused, /* other deps */]);
```

---

## PART 6: Handle Edge Cases

### 6a: Voices loading asynchronously (Chrome)

Chrome loads voices asynchronously. The `preloadVoices()` call in the mount effect handles this. If voice selection seems empty on first speak, the `speakText` function already falls back to any English voice.

### 6b: iOS Safari audio policy

The `unlockAudio()` + `handleSessionTap` pattern handles this. The silent buffer trick is the standard workaround.

### 6c: Cancel speech on quit/unmount

Add cleanup to the Session unmount:

```javascript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
}, []);
```

### 6d: Don't beep or speak when paused

The beep logic is inside the timer interval which already checks `if (paused) return;`. Make sure speech announcements also respect the paused state.

---

## File Checklist

| # | Action | File |
|---|--------|------|
| 1 | **CREATE** | `src/lib/coachVoice.js` — full file from Part 1 |
| 2 | **EDIT** | `src/lib/profileStorage.js` — add `getCoachVoice()` export |
| 3 | **EDIT** | `src/components/Profile.jsx` — add Coach Voice `<select>` dropdown |
| 4 | **EDIT** | `src/components/Session.jsx` — imports, unlock, announce, beep, cleanup |

---

## Testing Checklist

After implementation, verify:

- [ ] **Profile page:** Coach Voice dropdown appears with Off / Female / Male options
- [ ] **Profile page:** Selecting a voice and saving persists the choice (reload → still selected)
- [ ] **Session (voice = Off):** No speech, no beeps — completely silent
- [ ] **Session (voice = Female):** First exercise announced on session start
- [ ] **Session (countdown):** "Next up: [exercise name]. Get ready." spoken at start of countdown
- [ ] **Session (last 10s):** Beep plays every second for the last 10 seconds of countdown
- [ ] **Session (last 3s):** Beep pitch is higher (1200Hz vs 880Hz)
- [ ] **Session (complete):** "Great work! Session complete." spoken
- [ ] **iOS Safari:** Tap anywhere in session → audio works after first tap
- [ ] **Pause:** No beeps or speech while paused
- [ ] **Quit/Navigate away:** Speech is cancelled, no lingering audio

---

## Quick Reference: Audio API Summary

| Function | When to call | What it does |
|----------|-------------|-------------|
| `preloadVoices()` | Session mount | Pre-loads browser speech voices |
| `unlockAudio()` | First user tap in session | Unlocks AudioContext for iOS/Safari |
| `speakSessionStart(name, voice)` | Session begins, first work phase | "Let's go! Starting with [name]." |
| `speakNextExercise(name, voice)` | Phase transitions to countdown | "Next up: [name]. Get ready." |
| `playCountdownBeep(freq, ms)` | Every second in last 10s of countdown | Short sine-wave beep |
| `speakSessionComplete(voice)` | Session finishes | "Great work! Session complete." |
| `speechSynthesis.cancel()` | Session unmount / quit | Stops any queued speech |

---

## README Update

After implementation, add this row to the README changelog:

```
| Latest | **Audio system implemented** – Coach voice (Web Speech API) announces exercises during "Next in" countdown. Countdown beep (Web Audio API) plays each of the last 10 seconds (higher pitch for final 3). Profile dropdown: Off / Female / Male. Audio unlocked on first tap for iOS/Safari. See `src/lib/coachVoice.js`, `getCoachVoice()` in profileStorage, coach voice select in Profile, and audio integration in Session. |
```
