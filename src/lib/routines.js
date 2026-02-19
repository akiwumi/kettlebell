/**
 * Curated and user routines.
 * Curated = predefined; user = saved in the app's routine database (IndexedDB).
 */

import { exercises } from '../data/exercises';
import { getDailyExercises } from './dailyRotation';
import { getRoutines, getRoutinesCache, saveRoutine, deleteRoutine } from './routineDatabase';

/** Get full exercise objects by ids (order preserved). */
export function getExercisesByIds(ids) {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/** Pre-curated routines: id, name, description, getExercises(). */
export function getCuratedRoutines() {
  const today = getDailyExercises(new Date(), 6);
  return [
    {
      id: 'daily',
      name: "Today's rotation",
      description: 'Daily mix of 6 exercises',
      getExercises: () => getDailyExercises(new Date(), 6),
    },
    {
      id: 'quick-6',
      name: 'Quick 6',
      description: 'Swing, goblet squat, clean, press, row, plank',
      getExercises: () =>
        getExercisesByIds([
          'swing-2h',
          'goblet-squat',
          'clean',
          'press',
          'row',
          'plank-hold',
        ]),
    },
    {
      id: 'full-body',
      name: 'Full body',
      description: 'Hinge, squat, press, pull, carry',
      getExercises: () =>
        getExercisesByIds([
          'swing-2h',
          'goblet-squat',
          'push-press',
          'row',
          'suitcase-carry',
        ]),
    },
    {
      id: 'strength',
      name: 'Strength focus',
      description: 'Heavier moves: TGU, goblet, press, deadlift',
      getExercises: () =>
        getExercisesByIds(['tgu', 'goblet-squat', 'press', 'deadlift-2h']),
    },
    {
      id: 'cardio',
      name: 'Cardio flow',
      description: 'Swings and snatches for conditioning',
      getExercises: () =>
        getExercisesByIds([
          'swing-2h',
          'swing-1h',
          'snatch',
          'alternating-swings',
          'dead-stop-swing',
        ]),
    },
  ];
}

/** Sync: returns cached list (from routine database). Use getRoutines() for async load. */
export function getUserRoutines() {
  return getRoutinesCache();
}

/** Load user routines from database (async). Call on My Routines tab and after save/delete. */
export { getRoutines };

/** User routine: { id?, name, exerciseIds[] }. Saves to routine database. */
export async function saveUserRoutine(routine) {
  return saveRoutine(routine);
}

export async function deleteUserRoutine(id) {
  return deleteRoutine(id);
}

export function getUserRoutineExercises(routine) {
  return getExercisesByIds(routine.exerciseIds || []);
}
