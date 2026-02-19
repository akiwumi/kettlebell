import { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { getSchedule, saveSchedule } from '../lib/scheduleStorage';
import styles from './Schedule.module.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Schedule() {
  const [schedule, setSchedule] = useState(getSchedule);

  useEffect(() => {
    saveSchedule(schedule);
  }, [schedule]);

  const update = (key, value) => setSchedule((s) => ({ ...s, [key]: value }));

  const toggleDay = (listKey, dayNum) => {
    setSchedule((s) => {
      const arr = s[listKey] || [];
      const next = arr.includes(dayNum) ? arr.filter((d) => d !== dayNum) : [...arr, dayNum].sort((a, b) => a - b);
      return { ...s, [listKey]: next };
    });
  };

  return (
    <>
      <PageHeader title="Schedule & reminders" subtitle="Workout days, rest days, and check-ins" />
      <div className={styles.content}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Workout days</h3>
          <p className={styles.hint}>Tap days you usually train.</p>
          <div className={styles.dayRow}>
            {DAYS.map((label, i) => (
              <button
                key={i}
                type="button"
                className={schedule.preferredDays?.includes(i) ? `${styles.dayBtn} ${styles.dayBtnActive}` : styles.dayBtn}
                onClick={() => toggleDay('preferredDays', i)}
                aria-pressed={schedule.preferredDays?.includes(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Rest days</h3>
          <p className={styles.hint}>Mark days you typically rest.</p>
          <div className={styles.dayRow}>
            {DAYS.map((label, i) => (
              <button
                key={i}
                type="button"
                className={schedule.restDays?.includes(i) ? `${styles.dayBtn} ${styles.restActive}` : styles.dayBtn}
                onClick={() => toggleDay('restDays', i)}
                aria-pressed={schedule.restDays?.includes(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Deload week</h3>
          <p className={styles.hint}>Schedule a lighter week every N weeks (0 = off).</p>
          <select
            value={schedule.deloadEveryWeeks ?? 0}
            onChange={(e) => update('deloadEveryWeeks', parseInt(e.target.value, 10))}
            className={styles.select}
            aria-label="Deload every N weeks"
          >
            {[0, 3, 4, 5, 6, 8].map((n) => (
              <option key={n} value={n}>{n === 0 ? 'Off' : `Every ${n} weeks`}</option>
            ))}
          </select>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Reminders</h3>
          <div className={styles.reminderList}>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={schedule.reminderWorkout ?? true}
                onChange={(e) => update('reminderWorkout', e.target.checked)}
              />
              <span>Workout reminder</span>
              <input
                type="time"
                value={schedule.reminderWorkoutTime ?? '08:00'}
                onChange={(e) => update('reminderWorkoutTime', e.target.value)}
                className={styles.timeInput}
              />
            </label>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={schedule.reminderWeighIn ?? false}
                onChange={(e) => update('reminderWeighIn', e.target.checked)}
              />
              <span>Weigh-in / progress check-in</span>
              <input
                type="time"
                value={schedule.reminderWeighInTime ?? '07:00'}
                onChange={(e) => update('reminderWeighInTime', e.target.value)}
                className={styles.timeInput}
                disabled={!schedule.reminderWeighIn}
              />
            </label>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={schedule.reminderMeasurements ?? false}
                onChange={(e) => update('reminderMeasurements', e.target.checked)}
              />
              <span>Body measurements</span>
              <input
                type="time"
                value={schedule.reminderMeasurementsTime ?? '07:00'}
                onChange={(e) => update('reminderMeasurementsTime', e.target.value)}
                className={styles.timeInput}
                disabled={!schedule.reminderMeasurements}
              />
            </label>
            <label className={styles.switchRow}>
              <input
                type="checkbox"
                checked={schedule.reminderPhotos ?? false}
                onChange={(e) => update('reminderPhotos', e.target.checked)}
              />
              <span>Progress photos</span>
              <input
                type="time"
                value={schedule.reminderPhotosTime ?? '07:00'}
                onChange={(e) => update('reminderPhotosTime', e.target.value)}
                className={styles.timeInput}
                disabled={!schedule.reminderPhotos}
              />
            </label>
          </div>
          <p className={styles.note}>Notifications require permission in your device settings.</p>
        </section>
      </div>
    </>
  );
}
