/**
 * AI-style analysis engine for kettlebell training data.
 * Runs 6 local algorithms over workouts, body metrics, schedule, and profile.
 * No external API; all logic is deterministic and runs in the client.
 */

import { getWorkouts, getBodyMetrics, getPRs } from '../lib/trackingStorage';
import { getSchedule } from '../lib/scheduleStorage';
import { loadProfile } from '../lib/profileStorage';
import { exercises } from '../data/exercises';

const CATEGORY_LABELS = {
  hinge: 'Hinge',
  squat: 'Squat',
  press: 'Press',
  pull: 'Pull',
  carry: 'Carry',
  mobility: 'Mobility',
  compound: 'Compound',
  core: 'Core',
};

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ms) {
  const d = new Date(ms);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function idToCategory(exerciseId) {
  const ex = exercises.find((e) => e.id === exerciseId);
  return ex ? ex.category : null;
}

/** Estimate volume for one workout (simplified: exercises × sets × reps × 10 kg if no weight). */
function workoutVolume(w) {
  if (!w.exercises || !w.exercises.length) return 0;
  return w.exercises.reduce((sum, e) => {
    const sets = e.sets ?? 1;
    const reps = e.reps ?? 10;
    const weight = e.weight != null ? parseFloat(e.weight) : 10;
    return sum + sets * reps * weight;
  }, 0);
}

/**
 * 1. Workout consistency – sessions per week over last 4 weeks.
 */
export function analyzeWorkoutConsistency() {
  const workouts = getWorkouts();
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = startOfWeek(now - i * oneWeek);
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    const count = workouts.filter(
      (w) => w.completedAt >= weekStart && w.completedAt < weekEnd
    ).length;
    weeks.push({ weekStart, count });
  }
  const recent = weeks.map((w) => w.count);
  const avg = recent.reduce((a, b) => a + b, 0) / 4;
  const trend = recent[0] >= (recent[1] ?? 0) ? 'stable_or_up' : 'down';

  let summary =
    avg >= 2.5
      ? "You're building a solid habit with consistent sessions each week."
      : avg >= 1
        ? 'Aim for 2–3 sessions per week to see steady progress.'
        : workouts.length === 0
          ? 'Log your first workout to start tracking consistency.'
          : 'Try to schedule at least 2 sessions this week.';
  let metric = avg > 0 ? `~${avg.toFixed(1)} sessions/week (last 4 weeks)` : null;

  return {
    id: 'consistency',
    type: 'consistency',
    title: 'Workout consistency',
    summary,
    metric,
    trend,
  };
}

/**
 * 2. Volume trend – total volume over recent workouts.
 */
export function analyzeVolumeTrend() {
  const workouts = getWorkouts().slice(0, 14);
  if (workouts.length < 2) {
    return {
      id: 'volume',
      type: 'volume',
      title: 'Volume trend',
      summary: 'Log a few more workouts to see your volume trend over time.',
      metric: null,
    };
  }
  const withVol = workouts.map((w) => ({
    ...w,
    vol: workoutVolume(w),
  })).filter((w) => w.vol > 0);
  if (withVol.length < 2) {
    return {
      id: 'volume',
      type: 'volume',
      title: 'Volume trend',
      summary: 'Add sets, reps, or weight to your logged exercises to track volume.',
      metric: null,
    };
  }
  const recent = withVol.slice(0, 5).reduce((s, w) => s + w.vol, 0);
  const older = withVol.slice(5, 10).reduce((s, w) => s + w.vol, 0) || recent;
  const trend = recent >= older ? 'up' : 'down';
  const summary =
    trend === 'up'
      ? 'Your training volume is trending up — great for building strength.'
      : 'Volume has dipped recently; consider adding a set or a few reps when ready.';
  const metric = `Last 5 workouts: ~${Math.round(recent)} kg total volume`;

  return {
    id: 'volume',
    type: 'volume',
    title: 'Volume trend',
    summary,
    metric,
    trend,
  };
}

/**
 * 3. Goal progress – weight vs target from profile/body metrics.
 */
export function analyzeGoalProgress() {
  const profile = loadProfile();
  const body = getBodyMetrics();
  const target = profile.targetWeight != null ? parseFloat(profile.targetWeight) : null;
  const current = body.length && body[0].weight != null ? parseFloat(body[0].weight) : (profile.weight ? parseFloat(profile.weight) : null);
  const start = body.length && body[body.length - 1].weight != null ? parseFloat(body[body.length - 1].weight) : current;

  if (target == null || current == null) {
    return {
      id: 'goal',
      type: 'goal',
      title: 'Goal progress',
      summary: 'Set a target weight in Profile and log body metrics to track progress.',
      metric: null,
    };
  }
  const diff = target - current;
  const totalDiff = target - (start ?? current);
  const pct = totalDiff !== 0 ? Math.round((Math.abs(current - (start ?? current)) / Math.abs(totalDiff)) * 100) : 100;
  const summary =
    Math.abs(diff) < 1
      ? "You're at or very close to your target weight. Well done!"
      : diff > 0
        ? `You're ${Math.abs(diff).toFixed(1)} kg away from your target. Keep going.`
        : `You're ${Math.abs(diff).toFixed(1)} kg below your target. Consider adjusting your goal if needed.`;
  const metric = `${pct}% toward goal · ${current} → ${target} kg`;

  return {
    id: 'goal',
    type: 'goal',
    title: 'Goal progress',
    summary,
    metric,
    percent: Math.min(100, pct),
  };
}

/**
 * 4. Streak & adherence – current streak and adherence rate.
 */
export function analyzeStreakAndAdherence() {
  const workouts = getWorkouts();
  const profile = loadProfile();
  const days = [...new Set(workouts.map((w) => startOfDay(new Date(w.completedAt))))].sort((a, b) => b - a);
  const today = startOfDay(Date.now());
  let streak = 0;
  if (days.length > 0 && (days[0] === today || days[0] === today - 86400000)) {
    let expect = days[0];
    for (const d of days) {
      if (d !== expect) break;
      streak++;
      expect -= 86400000;
    }
  }
  const daysPerWeek = profile.trainingDaysPerWeek ? parseInt(profile.trainingDaysPerWeek, 10) : 3;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const planned = daysPerWeek * 4;
  const thisMonth = workouts.filter((w) => new Date(w.completedAt) >= monthStart).length;
  const adherence = planned > 0 ? Math.round((thisMonth / planned) * 100) : null;

  let summary =
    streak >= 7
      ? `${streak}-day streak! Consistency is key.`
      : streak >= 3
        ? `Nice ${streak}-day streak. One more session keeps the momentum.`
        : workouts.length === 0
          ? 'Complete a workout to start your first streak.'
          : 'Schedule your next session to build a streak.';
  const metric = adherence != null ? `Streak: ${streak} days · Adherence: ${Math.min(100, adherence)}%` : `Streak: ${streak} days`;

  return {
    id: 'streak',
    type: 'streak',
    title: 'Streak & adherence',
    summary,
    metric,
    streak,
    adherence,
  };
}

/**
 * 5. Exercise variety – category distribution in recent workouts.
 */
export function analyzeExerciseVariety() {
  const workouts = getWorkouts().slice(0, 10);
  const categoryCount = {};
  workouts.forEach((w) => {
    (w.exercises || []).forEach((e) => {
      const cat = idToCategory(e.exerciseId);
      if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
  });
  const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
  if (total < 3) {
    return {
      id: 'variety',
      type: 'variety',
      title: 'Exercise variety',
      summary: 'Log workouts with multiple exercises to see variety and balance across movement patterns.',
      metric: null,
    };
  }
  const categories = Object.keys(CATEGORY_LABELS);
  const under = categories.filter((c) => (categoryCount[c] || 0) < 2);
  const summary =
    under.length === 0
      ? 'Good mix of hinge, squat, press, pull, and more. Keep it varied.'
      : `Consider adding more ${under.map((c) => CATEGORY_LABELS[c] || c).join(' or ')} in upcoming sessions.`;
  const top = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => CATEGORY_LABELS[c] || c)
    .join(', ');
  const metric = `Most used: ${top}`;

  return {
    id: 'variety',
    type: 'variety',
    title: 'Exercise variety',
    summary,
    metric,
  };
}

/**
 * 6. Next best action – single recommendation.
 */
export function analyzeNextBestAction() {
  const workouts = getWorkouts();
  const body = getBodyMetrics();
  const schedule = getSchedule();
  const profile = loadProfile();

  const lastWorkout = workouts[0] ? new Date(workouts[0].completedAt).getTime() : 0;
  const daysSinceWorkout = lastWorkout ? (Date.now() - lastWorkout) / (24 * 60 * 60 * 1000) : 999;
  const lastBody = body[0] ? new Date(body[0].date).getTime() : 0;
  const daysSinceBody = lastBody ? (Date.now() - lastBody) / (24 * 60 * 60 * 1000) : 999;

  if (workouts.length === 0) {
    return {
      id: 'next',
      type: 'action',
      title: 'Next best action',
      summary: 'Start with a short session from the routine page. Even one round counts.',
      suggestion: 'Choose routine & start workout',
      link: '/routine',
    };
  }
  if (daysSinceWorkout > 3) {
    return {
      id: 'next',
      type: 'action',
      title: 'Next best action',
      summary: "It's been a few days since your last workout. Schedule a session to keep momentum.",
      suggestion: 'Start a session',
      link: '/routine',
    };
  }
  if (body.length === 0 || daysSinceBody > 14) {
    return {
      id: 'next',
      type: 'action',
      title: 'Next best action',
      summary: 'Log a quick weight or measurement to track progress over time.',
      suggestion: 'Log body metrics',
      link: '/data/body',
    };
  }
  if (!schedule.reminderWorkout && profile.trainingDaysPerWeek > 0) {
    return {
      id: 'next',
      type: 'action',
      title: 'Next best action',
      summary: 'Turn on workout reminders so you never miss a planned day.',
      suggestion: 'Set reminders',
      link: '/schedule',
    };
  }
  return {
    id: 'next',
    type: 'action',
    title: 'Next best action',
    summary: 'You’re on track. Rest well and hit your next session when planned.',
    suggestion: 'View dashboard',
    link: '/dashboard',
  };
}

/**
 * Run all 6 analyses and return an array of insight objects.
 */
export function getAllInsights() {
  return [
    analyzeWorkoutConsistency(),
    analyzeVolumeTrend(),
    analyzeGoalProgress(),
    analyzeStreakAndAdherence(),
    analyzeExerciseVariety(),
    analyzeNextBestAction(),
  ];
}

/**
 * Return one highlight for the dashboard card (e.g. next action or streak).
 */
export function getTopInsight() {
  const next = analyzeNextBestAction();
  const streak = analyzeStreakAndAdherence();
  if (streak.streak >= 3) return streak;
  return next;
}
