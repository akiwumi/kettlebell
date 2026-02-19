/**
 * LocalStorage helpers for progression tracking data.
 */

const KEYS = {
  WORKOUTS: 'kettlebell-workouts',
  BODY_METRICS: 'kettlebell-body-metrics',
  PRS: 'kettlebell-prs',
};

function load(key, defaultValue = []) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : defaultValue;
  } catch (_) {
    return defaultValue;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

// Workout logs: array of { id, completedAt, plannedDurationMin, actualDurationMin, exercises: [{ exerciseId, sets, reps, weight, ... }], rpe, energyBefore, energyAfter, modifications, skipped: [{ exerciseId, reason }], prsAchieved }
export function getWorkouts() {
  return load(KEYS.WORKOUTS);
}

export function saveWorkout(workout) {
  const list = getWorkouts();
  const next = { id: Date.now().toString(), ...workout };
  list.unshift(next);
  save(KEYS.WORKOUTS, list);
  return next;
}

export function updateWorkout(id, updates) {
  const list = getWorkouts().map((w) => (w.id === id ? { ...w, ...updates } : w));
  save(KEYS.WORKOUTS, list);
}

// Body metrics: array of { date, weight, chest, waist, hips, arms, thighs, calves, bodyFat, clothesFit, photoUrl }
export function getBodyMetrics() {
  return load(KEYS.BODY_METRICS);
}

export function saveBodyMetric(entry) {
  const list = getBodyMetrics();
  list.unshift(entry);
  save(KEYS.BODY_METRICS, list);
}

// PRs: array of { date, exerciseId, exerciseName, type: 'weight'|'reps'|'time', value, note }
export function getPRs() {
  return load(KEYS.PRS);
}

export function savePR(entry) {
  const list = getPRs();
  list.unshift(entry);
  save(KEYS.PRS, list);
}
