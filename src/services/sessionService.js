import { supabase } from '../lib/supabaseClient';

/**
 * Save a completed workout session to Supabase.
 * Requires user_id from auth.
 *
 * @param {Object} params
 * @param {string} params.userId - Required. From useAuth().user.id
 * @param {string} [params.id] - Optional session id (for updates)
 * @param {string[]} params.exerciseIds - Exercise ids in order
 * @param {Object[]} [params.exercises] - Full exercise objects for JSONB
 * @param {number} params.workSeconds
 * @param {number} [params.restSeconds]
 * @param {number} params.rounds
 * @param {number} params.completedAt - Unix ms
 * @param {number} [params.durationSeconds]
 * @param {string} [params.routineName]
 */
export async function saveSession({
  userId,
  id,
  exerciseIds,
  exercises,
  workSeconds,
  restSeconds,
  rounds,
  completedAt,
  durationSeconds,
  routineName,
}) {
  if (!supabase || !userId) return { data: null, error: { message: 'Not authenticated' } };

  const completed = completedAt ? new Date(completedAt) : new Date();
  const exercisesPayload = Array.isArray(exercises) && exercises.length > 0
    ? exercises.map((e) => ({ id: e.id, name: e.name, reps: e.reps, sets: e.sets, weight: e.weight }))
    : (exerciseIds || []).map((id) => ({ id, name: '', reps: null, sets: null, weight: null }));

  const row = {
    user_id: userId,
    date: completed.toISOString().slice(0, 10),
    duration_seconds: durationSeconds ?? null,
    exercises: exercisesPayload,
    work_seconds: workSeconds ?? null,
    rest_seconds: restSeconds ?? null,
    rounds: rounds ?? null,
    routine_name: routineName ?? null,
  };

  if (id) {
    return supabase.from('workout_sessions').update(row).eq('id', id).eq('user_id', userId).select().single();
  }
  return supabase.from('workout_sessions').insert(row).select().single();
}

/**
 * Fetch recent workout sessions for the current user (for history/stats).
 */
export async function getRecentSessions(userId, limit = 20) {
  if (!supabase || !userId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, date, duration_seconds, exercises, work_seconds, rest_seconds, rounds, routine_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}
