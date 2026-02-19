/**
 * One-time migration: import existing localStorage/IndexedDB data into Supabase.
 * Call after first login; prompt user "We found existing workout data. Import it?"
 */

const KEYS = {
  WORKOUTS: 'kettlebell-workouts',
  BODY_METRICS: 'kettlebell-body-metrics',
  PRS: 'kettlebell-prs',
  SCHEDULE: 'kettlebell-schedule',
  PROFILE: 'kettlebell-profile',
};
const MIGRATION_DONE_KEY = 'kettlebell-migration-done';

export function hasLocalDataToMigrate() {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return false;
    for (const key of Object.values(KEYS)) {
      if (key === KEYS.PROFILE) continue;
      const s = localStorage.getItem(key);
      if (s && s.length > 2) return true;
    }
  } catch (_) {}
  return false;
}

export function markMigrationDone() {
  try {
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
  } catch (_) {}
}

export async function migrateToSupabase(supabase, userId) {
  if (!supabase || !userId) return { ok: false, error: 'Missing supabase or userId' };

  try {
    const workoutsRaw = localStorage.getItem(KEYS.WORKOUTS);
    if (workoutsRaw) {
      const list = JSON.parse(workoutsRaw);
      if (Array.isArray(list)) {
        for (const w of list.slice(0, 500)) {
          const exercises = (w.exercises || []).map((e) => ({
            id: e.exerciseId || e.id,
            name: e.name,
            reps: e.reps,
            sets: e.sets,
            weight: e.weight,
          }));
          await supabase.from('workout_sessions').insert({
            user_id: userId,
            date: w.completedAt ? new Date(w.completedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            duration_seconds: (w.actualDurationMin || w.plannedDurationMin || 0) * 60,
            exercises,
            rounds: w.rounds ?? null,
            work_seconds: w.workSeconds ?? null,
            notes: w.modifications || w.notes || null,
          });
        }
      }
    }

    const bodyRaw = localStorage.getItem(KEYS.BODY_METRICS);
    if (bodyRaw) {
      const list = JSON.parse(bodyRaw);
      if (Array.isArray(list)) {
        for (const b of list.slice(0, 200)) {
          const date = b.date || new Date().toISOString().slice(0, 10);
          await supabase.from('body_metrics').insert({
            user_id: userId,
            date,
            weight_kg: b.weight ?? null,
            body_fat_pct: b.bodyFat ?? null,
            measurements: {
              chest: b.chest,
              waist: b.waist,
              hips: b.hips,
              arms: b.arms,
              thighs: b.thighs,
              calves: b.calves,
            },
            notes: b.notes || null,
          });
        }
      }
    }

    const prsRaw = localStorage.getItem(KEYS.PRS);
    if (prsRaw) {
      const list = JSON.parse(prsRaw);
      if (Array.isArray(list)) {
        for (const p of list.slice(0, 200)) {
          await supabase.from('personal_records').insert({
            user_id: userId,
            exercise_id: p.exerciseId || p.exercise_id || 'unknown',
            metric: p.type || 'weight',
            value: Number(p.value) || 0,
            date: p.date || new Date().toISOString().slice(0, 10),
          });
        }
      }
    }

    const scheduleRaw = localStorage.getItem(KEYS.SCHEDULE);
    if (scheduleRaw) {
      const s = JSON.parse(scheduleRaw);
      await supabase.from('schedules').upsert({
        user_id: userId,
        workout_days: s.preferredDays || [],
        rest_days: s.restDays || [],
        deload_week: s.deloadEveryWeeks || null,
        reminders: {
          workout: s.reminderWorkout,
          weighIn: s.reminderWeighIn,
          measurements: s.reminderMeasurements,
          photos: s.reminderPhotos,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    markMigrationDone();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
