/**
 * Build shareable text summary of progression and/or exercise data.
 */

import { getWorkouts, getBodyMetrics, getPRs } from './trackingStorage';

const PROFILE_KEY = 'kettlebell-profile';

function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

function startOfDay(ts) {
  const x = new Date(ts);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function computeStreak(workouts) {
  const days = [...new Set(workouts.map((w) => startOfDay(new Date(w.completedAt))))].sort((a, b) => b - a);
  if (days.length === 0) return 0;
  const today = startOfDay(Date.now());
  if (days[0] !== today && days[0] !== today - 86400000) return 0;
  let streak = 0;
  let expect = days[0];
  for (const d of days) {
    if (d !== expect) break;
    streak++;
    expect -= 86400000;
  }
  return streak;
}

function totalMinutes(workouts) {
  return workouts.reduce((sum, w) => sum + (w.actualDurationMin || w.plannedDurationMin || 0), 0);
}

function totalVolume(workouts) {
  return workouts.reduce((sum, w) => {
    return sum + (w.exercises || []).reduce((s, e) => {
      const sets = e.sets || 1;
      const reps = e.reps || 0;
      const weight = e.weight || 0;
      return s + sets * reps * weight;
    }, 0);
  }, 0);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * @param {{ includeProgression: boolean, includeExerciseData: boolean, includeName: boolean }} options
 * @returns {string}
 */
export function buildShareText(options) {
  const { includeProgression, includeExerciseData, includeName } = options;
  const profile = loadProfile();
  const workouts = getWorkouts();
  const body = getBodyMetrics();
  const prs = getPRs();

  const lines = [];
  const name = (profile.name || '').trim();
  if (includeName && name) {
    lines.push(`${name}'s Kettlebell Gym progress`);
    lines.push('');
  } else {
    lines.push('Kettlebell Gym progress');
    lines.push('');
  }

  if (includeProgression) {
    lines.push('—— Progression ——');
    const streak = computeStreak(workouts);
    const totalTimeMin = totalMinutes(workouts);
    const currentWeight = body.length && body[0].weight != null ? body[0].weight : (profile.weight || '—');
    const targetWeight = profile.targetWeight || '—';
    const latest = body[0];
    lines.push(`Current streak: ${streak} days`);
    lines.push(`Total training time: ${Math.round(totalTimeMin / 60)} hours`);
    lines.push(`Weight: ${currentWeight} kg${targetWeight !== '—' ? ` (goal: ${targetWeight} kg)` : ''}`);
    if (latest && (latest.waist != null || latest.chest != null)) {
      const parts = [];
      if (latest.waist != null) parts.push(`waist ${latest.waist} cm`);
      if (latest.chest != null) parts.push(`chest ${latest.chest} cm`);
      if (latest.hips != null) parts.push(`hips ${latest.hips} cm`);
      if (parts.length) lines.push(`Measurements: ${parts.join(', ')}`);
    }
    if (profile.primaryGoal) lines.push(`Goal: ${profile.primaryGoal}`);
    lines.push('');
  }

  if (includeExerciseData) {
    lines.push('—— Exercise & workouts ——');
    lines.push(`Total workouts logged: ${workouts.length}`);
    lines.push(`Total volume: ${Math.round(totalVolume(workouts) / 1000)}k kg`);
    const recent = workouts.slice(0, 5);
    if (recent.length > 0) {
      lines.push('Recent workouts:');
      recent.forEach((w) => {
        const date = formatDate(w.completedAt);
        const dur = w.actualDurationMin || w.plannedDurationMin || '?';
        const exCount = (w.exercises || []).length;
        lines.push(`  ${date} – ${dur} min, ${exCount} exercises`);
      });
    }
    if (prs.length > 0) {
      lines.push('Recent PRs:');
      prs.slice(0, 5).forEach((p) => {
        lines.push(`  ${p.exerciseName || p.exerciseId}: ${p.type} ${p.value}${p.note ? ` (${p.note})` : ''} – ${formatDate(p.date)}`);
      });
    }
    lines.push('');
  }

  lines.push('Shared from Kettlebell Gym app');
  return lines.join('\n').trim();
}

/**
 * Use native share when available, otherwise copy to clipboard.
 * @param {string} text
 * @param {string} title
 * @returns {Promise<'shared' | 'copied' | 'unsupported'>}
 */
export async function shareOrCopy(text, title = 'My Kettlebell Progress') {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
      // fall through to copy
    }
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  return 'unsupported';
}
