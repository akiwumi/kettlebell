# Exercise media (images & videos)

Full app documentation is in the **project README**: `kettlebell-app/README.md`.

This folder holds per-exercise images and videos used as **session backgrounds**. The session screen shows the current exercise’s media behind the timer and buttons (with a dark overlay so text stays readable).

## Naming

- **Images:** `images/<exercise-id>.jpg` or `images/<exercise-id>.webp`  
  Example: `images/swing-2h.jpg`, `images/goblet-squat.webp`
- **Videos:** `videos/<exercise-id>.mp4`  
  Example: `videos/swing-2h.mp4`

If both exist for an exercise, the **video** is used (muted, looping). Otherwise the image is used. On video load error, the app falls back to the image.

## Exercise IDs (from app)

`swing-2h`, `swing-1h`, `goblet-squat`, `tgu`, `clean`, `snatch`, `press`, `push-press`, `row`, `deadlift-2h`, `deadlift-1h`, `front-squat`, `halo`, `windmill`, `figure-8`, `around-world`, `thruster`, `clean-squat-press`, `single-leg-deadlift`, `lunge`, `cossack`, `bottoms-up-press`, `bent-over-row`, `high-pull`, `suitcase-carry`, `rack-walk`, `farmers-walk`, `plank-hold`, `dead-stop-swing`, `alternating-swings`

## Tips

- Use landscape or square for best fill; the app uses `object-fit: cover`.
- Keep file size reasonable for mobile (e.g. &lt; 5 MB per video).
- Videos play muted and loop; no audio is used.
