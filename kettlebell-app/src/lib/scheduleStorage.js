/**
 * Schedule and reminders – localStorage.
 */

const KEY = 'kettlebell-schedule';

const defaults = {
  preferredDays: [], // 0=Sun, 1=Mon, ...
  restDays: [],
  reminderWorkout: true,
  reminderWorkoutTime: '08:00',
  reminderWeighIn: false,
  reminderWeighInTime: '07:00',
  reminderMeasurements: false,
  reminderMeasurementsTime: '07:00',
  reminderPhotos: false,
  reminderPhotosTime: '07:00',
  deloadEveryWeeks: 0, // 0 = off
  deloadWeekStart: null, // ISO date when next deload starts
};

export function getSchedule() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? { ...defaults, ...JSON.parse(s) } : { ...defaults };
  } catch (_) {
    return { ...defaults };
  }
}

export function saveSchedule(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (_) {}
}
