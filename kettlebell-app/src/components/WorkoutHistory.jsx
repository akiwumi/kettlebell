import { useMemo } from 'react';
import { getWorkouts } from '../lib/trackingStorage';
import PageHeader from './PageHeader';
import styles from './WorkoutHistory.module.css';

function volume(workout) {
  return (workout.exercises || []).reduce(
    (sum, e) => sum + (e.sets || 0) * (e.reps || 0) * (e.weight || 0),
    0
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function exerciseSummary(exs) {
  if (!exs?.length) return '—';
  return exs.map((e) => e.exerciseName || e.exerciseId || '?').join(', ');
}

export default function WorkoutHistory() {
  const workouts = useMemo(() => getWorkouts(), []);

  if (workouts.length === 0) {
    return (
      <>
        <PageHeader title="Workout history" subtitle="All logged workouts" />
        <p className={styles.empty}>No workouts logged yet. Add entries in Workout log.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Workout history"
        subtitle={`${workouts.length} workout${workouts.length !== 1 ? 's' : ''} – scroll to see all`}
      />
      <div className={styles.wrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table} role="grid">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Exercises</th>
                <th>Volume</th>
                <th>RPE</th>
                <th>Energy</th>
                <th>Modifications</th>
                <th>Skipped</th>
                <th>PRs</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w.id}>
                  <td data-label="Date">{formatDate(w.completedAt)}</td>
                  <td data-label="Time">{formatTime(w.completedAt)}</td>
                  <td data-label="Planned (min)">{w.plannedDurationMin ?? '—'}</td>
                  <td data-label="Actual (min)">{w.actualDurationMin ?? '—'}</td>
                  <td data-label="Exercises" className={styles.cellSummary}>
                    {exerciseSummary(w.exercises)}
                  </td>
                  <td data-label="Volume (kg)">{volume(w) ? Math.round(volume(w)) : '—'}</td>
                  <td data-label="RPE">{w.rpe ?? '—'}</td>
                  <td data-label="Energy">
                    {w.energyBefore != null || w.energyAfter != null
                      ? `${w.energyBefore ?? '—'}/${w.energyAfter ?? '—'}`
                      : '—'}
                  </td>
                  <td data-label="Modifications" className={styles.cellText}>
                    {w.modifications || '—'}
                  </td>
                  <td data-label="Skipped" className={styles.cellText}>
                    {w.skipped?.length
                      ? w.skipped.map((s) => `${s.exerciseId || '?'}: ${s.reason || ''}`).join('; ')
                      : '—'}
                  </td>
                  <td data-label="PRs" className={styles.cellText}>
                    {w.prsAchieved || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
