import { exercises } from '../data/exercises.js';

/**
 * Seed for deterministic daily rotation (same day = same workout).
 */
function getDaySeed(date) {
  const str = typeof date === 'string' ? date : toDateString(date);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function toDateString(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

function shuffleWithSeed(arr, seed) {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getDailyExercises(date = new Date(), count = 6) {
  const seed = getDaySeed(date);
  const shuffled = shuffleWithSeed(exercises, seed);
  return shuffled.slice(0, count);
}

export function getDailyExerciseIds(date = new Date(), count = 6) {
  return getDailyExercises(date, count).map((e) => e.id);
}

export function isInTodayRotation(exerciseId, date = new Date(), count = 6) {
  return getDailyExerciseIds(date, count).includes(exerciseId);
}

export function getExercisesByCategory(categoryId) {
  if (!categoryId) return exercises;
  return exercises.filter((e) => e.category === categoryId);
}
