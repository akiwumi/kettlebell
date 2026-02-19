# Session background videos

Place exercise videos here. The session screen uses them as the background when that exercise is active. **If a file is missing, the app will request it (e.g. from Netlify), get a 404, and fall back to the exercise image or a dark background.**

**Naming:** Use `<exercise-id>.mp4` (e.g. `goblet-squat.mp4`, `swing-2h.mp4`). Some exercises use a different filename and are mapped in `src/lib/exerciseMedia.js` (VIDEO_OVERRIDES):

- `deadlift-2h` → **Two-Hand-Deadlift.mp4**
- `dead-stop-swing` → **Dead-Stop-Swing.mp4**

**Files currently in this folder** (that are used via overrides or by id): `Two-Hand-Deadlift.mp4`, `Dead-Stop-Swing.mp4`. For **Goblet Squat** and other exercises you need to add the matching file, e.g.:

- `goblet-squat.mp4`
- `swing-2h.mp4`, `swing-1h.mp4`
- `tgu.mp4`, `clean.mp4`, `snatch.mp4`, `press.mp4`, etc.

Add any `<exercise-id>.mp4` here and commit so deployments (e.g. Netlify) serve them; otherwise you’ll see 404s and the session will use image/dark fallback.
