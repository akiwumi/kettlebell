# Audio System — Manual Test Checklist

Run the app (`npm run dev`), then follow these steps. Dev server: **http://localhost:5176/** (or the port Vite prints).

---

## 1. Profile: Coach Voice dropdown and persist

- [ ] Go to **Profile** (bottom nav or menu).
- [ ] At the **top** of the form you’ll see a **“Session audio”** section with the **Coach voice** dropdown (Off / Female / Male).
- [ ] Options: **Off**, **Female**, **Male**.
- [ ] Select **Female** → reload page (F5 or navigate away and back) → Coach voice should still be **Female**.
- [ ] Select **Off** → reload → should stay **Off**.
- [ ] Select **Male** → reload → should stay **Male**.

---

## 2. Session with voice **Off**: no speech, no beeps

- [ ] Set Coach voice to **Off** in Profile (and save / reload to be sure).
- [ ] Go to **Routine** → pick any routine → **Timer setup** → **Start session**.
- [ ] **Expected:** No “Let’s go! Starting with…”, no “Next up: … Get ready.”, no beeps in the last 10 s of countdown, no “Great work! Session complete.” at the end. Session is silent.

---

## 3. Session with **Female** or **Male**: full audio

- [ ] Set Coach voice to **Female** (or **Male**) in Profile.
- [ ] Start a session (Routine → Timer setup → Start session).
- [ ] **First exercise:** Shortly after session starts, hear: **“Let’s go! Starting with [exercise name].”**
- [ ] Let the work phase finish; countdown (“Next in”) starts.
- [ ] **Next exercise:** Hear: **“Next up: [next exercise name]. Get ready.”**
- [ ] **Last 10 s of countdown:** A short beep every second (10 beeps total).
- [ ] **Last 3 s:** Beeps are higher pitch than the first 7.
- [ ] When the session completes: **“Great work! Session complete.”**

---

## 4. First tap unlocks audio (iOS/Safari)

- [ ] On a device or simulator: set Coach voice to **Female** or **Male**, start a session.
- [ ] **Before any tap:** Audio might not play (e.g. Safari blocks until user gesture).
- [ ] **After one tap** anywhere on the session screen: announcements and beeps should work for the rest of the session.

*(In desktop Chrome you may not notice this; the main target is iOS/Safari.)*

---

## 5. Pause: no beeps or speech while paused

- [ ] Start a session with Coach voice **Female** or **Male**.
- [ ] During the **countdown** phase (e.g. when “Next in” shows ~15 s left), click **Pause**.
- [ ] **Expected:** No more beeps and no new speech while paused. Timer is frozen.
- [ ] Click **Start** again: countdown and beeps (in last 10 s) resume as normal.

---

## 6. Navigate away: speech cancelled on unmount

- [ ] Start a session with Coach voice **Female** or **Male**.
- [ ] Wait for “Next up: … Get ready.” to **start** speaking.
- [ ] Immediately click **Quit** (or use browser back / navigate to Home).
- [ ] **Expected:** Speech stops right away (no continuing or lingering “Get ready” or other phrases).

---

## Quick reference

| Check              | Voice  | Expected |
|--------------------|--------|----------|
| Profile dropdown   | —      | Off / Female / Male; persists after reload |
| Session silent     | Off    | No speech, no beeps |
| Session start      | F/M    | “Let’s go! Starting with [name].” |
| Countdown start    | F/M    | “Next up: [name]. Get ready.” |
| Last 10 s          | F/M    | Beep every second; higher pitch last 3 s |
| Session complete   | F/M    | “Great work! Session complete.” |
| First tap          | F/M    | Unlocks audio on iOS/Safari |
| Pause              | F/M    | No beeps or speech while paused |
| Quit / navigate     | F/M    | Speech cancels immediately |
