/**
 * exerciseMedia.js
 *
 * Resolves per-exercise image / video URLs from the local
 * public/exercise-media/ folder.
 *
 * FIX:  Uses import.meta.env.BASE_URL (set by Vite) so paths work both
 *       on localhost:5173 (base "/") and deployed subpaths (e.g. "/app/").
 *       Previously used window.location.origin which broke when the app was
 *       served from a subpath and could produce double-slashes or wrong roots.
 *
 * Files live in:
 *   public/exercise-media/videos/<id>.mp4
 *   public/exercise-media/images/<id>.jpg  (or .webp)
 */

// ── Filename overrides ──────────────────────────────────────────────
// When the video/image filename doesn't match the exercise id, map it here.
// Key = exercise id, value = filename WITH extension.
const VIDEO_OVERRIDES = {
  'deadlift-2h': 'Two-Hand-Deadlift.mp4',
  // add more as needed, e.g.:
  // 'swing-2h': 'Two-Hand-Swing.mp4',
};

const IMAGE_OVERRIDES = {
  // 'deadlift-2h': 'Two-Hand-Deadlift.jpg',
};

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a URL that resolves to the public/ folder no matter what
 * base path Vite was configured with.
 *
 * import.meta.env.BASE_URL is:
 *   "/"      in dev  (default)
 *   "/app/"  when vite.config.js has  base: '/app/'
 *
 * We always ensure it ends with "/" so we can concatenate cleanly.
 */
function publicUrl(relativePath) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/*$/, '/');
  return `${base}${relativePath}`;
}

// ── Main API ─────────────────────────────────────────────────────────

/**
 * getExerciseMedia(exerciseId)
 *
 * Returns { video, image } with absolute-path URLs.
 * Either or both may be null if you haven't placed the file yet.
 * The Session component tries video first, then image, then dark fallback.
 *
 * @param  {string} exerciseId  e.g. "swing-2h", "deadlift-2h"
 * @return {{ video: string|null, image: string|null }}
 */
export function getExerciseMedia(exerciseId) {
  if (!exerciseId) return { video: null, image: null };

  // Video URL
  const videoFile = VIDEO_OVERRIDES[exerciseId] || `${exerciseId}.mp4`;
  const video = publicUrl(`exercise-media/videos/${videoFile}`);

  // Image URL – try .jpg first; the component can also try .webp via onerror
  const imageFile =
    IMAGE_OVERRIDES[exerciseId] || `${exerciseId}.jpg`;
  const image = publicUrl(`exercise-media/images/${imageFile}`);

  return { video, image };
}

export default getExerciseMedia;
