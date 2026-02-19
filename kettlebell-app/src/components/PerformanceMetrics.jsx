import { useState } from 'react';
import { getWorkouts, getPRs, savePR } from '../lib/trackingStorage';
import { exercises } from '../data/exercises';
import PageHeader from './PageHeader';
import Button from './Button';
import styles from './PerformanceMetrics.module.css';

export default function PerformanceMetrics() {
  const [prForm, setPrForm] = useState({
    exerciseId: '',
    type: 'weight',
    value: '',
    note: '',
  });
  const [saved, setSaved] = useState(false);

  const workouts = getWorkouts();
  const prs = getPRs();

  const volumeOverTime = workouts
    .slice()
    .reverse()
    .map((w) => {
      const vol = (w.exercises || []).reduce(
        (s, e) => s + (e.sets || 0) * (e.reps || 0) * (e.weight || 0),
        0
      );
      return { date: w.completedAt, volume: vol };
    });

  const handleAddPR = (e) => {
    e.preventDefault();
    const ex = exercises.find((x) => x.id === prForm.exerciseId);
    savePR({
      date: new Date().toISOString(),
      exerciseId: prForm.exerciseId,
      exerciseName: ex?.name ?? prForm.exerciseId,
      type: prForm.type,
      value: prForm.value,
      note: prForm.note || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setPrForm({ exerciseId: '', type: 'weight', value: '', note: '' });
  };

  return (
    <>
      <PageHeader title="Performance metrics" subtitle="Strength, endurance, PRs" />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Personal records (PRs) log</h2>
        <form className={styles.prForm} onSubmit={handleAddPR}>
          <select
            value={prForm.exerciseId}
            onChange={(e) => setPrForm((p) => ({ ...p, exerciseId: e.target.value }))}
            required
          >
            <option value="">Select exercise</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <select
            value={prForm.type}
            onChange={(e) => setPrForm((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="weight">Weight (kg)</option>
            <option value="reps">Reps</option>
            <option value="time">Time</option>
          </select>
          <input
            type="text"
            placeholder="Value"
            value={prForm.value}
            onChange={(e) => setPrForm((p) => ({ ...p, value: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={prForm.note}
            onChange={(e) => setPrForm((p) => ({ ...p, note: e.target.value }))}
          />
          <Button type="submit">{saved ? 'Saved!' : 'Add PR'}</Button>
        </form>
        <ul className={styles.prList}>
          {prs.length ? prs.slice(0, 15).map((pr, i) => (
            <li key={i} className={styles.prItem}>
              <strong>{pr.exerciseName}</strong> – {pr.type}: {pr.value}
              {pr.note && ` (${pr.note})`}
              <span className={styles.prDate}>{new Date(pr.date).toLocaleDateString()}</span>
            </li>
          )) : <li className={styles.empty}>No PRs logged yet</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Volume progression over time</h2>
        <p className={styles.hint}>Total sets×reps×weight per workout (most recent last)</p>
        <ul className={styles.volumeList}>
          {volumeOverTime.length ? volumeOverTime.slice(-10).map((v, i) => (
            <li key={i} className={styles.volumeItem}>
              <span>{new Date(v.date).toLocaleDateString()}</span>
              <strong>{v.volume.toLocaleString()}</strong>
            </li>
          )) : <li className={styles.empty}>Log workouts to see volume</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Strength & endurance</h2>
        <p className={styles.hint}>
          Track weight increases and rep progress in the Workout log (sets/reps/weight per exercise).
          PRs above show key milestones. For endurance: more reps at same weight over time; for strength: heavier weight for same reps.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Rest time & skill</h2>
        <p className={styles.hint}>
          Rest time decreases and skill progression (modified → full movements) can be noted in the workout log under &quot;Modifications made&quot; and &quot;Personal records achieved&quot;.
        </p>
      </section>
    </>
  );
}
