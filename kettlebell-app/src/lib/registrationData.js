/**
 * Export all user data to match the registration data table schema.
 * Used for backup, export, or syncing to public/registration/user-data.json shape.
 */

import { getWorkouts, getBodyMetrics, getPRs } from './trackingStorage';
import { getSchedule } from './scheduleStorage';
import { getUserRoutines } from './routines';

const PROFILE_KEY = 'kettlebell-profile';

function loadProfileRaw() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Returns the full user data object matching the registration user-data.json schema.
 * All fields correspond to app options (profile, workout log, body metrics, PRs, schedule, routines).
 */
export function getAllUserData() {
  return {
    profile: loadProfileRaw(),
    workoutHistory: getWorkouts(),
    bodyMetrics: getBodyMetrics(),
    prs: getPRs(),
    schedule: getSchedule(),
    userRoutines: getUserRoutines(),
  };
}
