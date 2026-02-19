import { useState } from 'react';
import { exercises } from '../data/exercises';
import { saveWorkout, getWorkouts } from '../lib/trackingStorage';
import PageHeader from './PageHeader';
import Button from './Button';
import styles from './WorkoutLog.module.css';

const defaultRow = { exerciseId: '', sets: '', reps: '', weight: '' };

export default function WorkoutLog() {
  const [completedAt, setCompletedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [plannedDurationMin, setPlannedDurationMin] = useState('');
  const [actualDurationMin, setActualDurationMin] = useState('');
  const [rows, setRows] = useState([{ ...defaultRow }]);
  const [rpe, setRpe] = useState('');
  const [energyBefore, setEnergyBefore] = useState('');
  const [energyAfter, setEnergyAfter] = useState('');
  const [modifications, setModifications] = useState('');
  const [skipped, setSkipped] = useState([{ exerciseId: '', reason: '' }]);
  const [prsAchieved, setPrsAchieved] = useState('');
  const [saved, setSaved] = useState(false);

  const addRow = () => setRows((r) => [...r, { ...defaultRow }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const addSkipped = () => setSkipped((s) => [...s, { exerciseId: '', reason: '' }]);
  const removeSkipped = (i) => setSkipped((s) => s.filter((_, idx) => idx !== i));
  const updateSkipped = (i, field, value) => {
    setSkipped((s) => s.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const completed = rows
      .filter((r) => r.exerciseId)
      .map((r) => ({
        exerciseId: r.exerciseId,
        exerciseName: exercises.find((e) => e.id === r.exerciseId)?.name ?? r.exerciseId,
        sets: Number(r.sets) || 0,
        reps: Number(r.reps) || 0,
        weight: Number(r.weight) || 0,
      }));
    const skippedFiltered = skipped.filter((s) => s.exerciseId || s.reason);
    saveWorkout({
      completedAt: new Date(completedAt).toISOString(),
      plannedDurationMin: Number(plannedDurationMin) || null,
      actualDurationMin: Number(actualDurationMin) || null,
      exercises: completed,
      rpe: rpe ? Number(rpe) : null,
      energyBefore: energyBefore || null,
      energyAfter: energyAfter || null,
      modifications: modifications || null,
      skipped: skippedFiltered.length ? skippedFiltered : null,
      prsAchieved: prsAchieved || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const workouts = getWorkouts();

  return (
    <>
      <PageHeader title="Workout log" subtitle="Log each workout" />
      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Date & duration</h2>
          <div className={styles.field}>
            <label>Date and time completed</label>
            <input
              type="datetime-local"
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Planned duration (min)</label>
              <input
                type="number"
                min="0"
                value={plannedDurationMin}
                onChange={(e) => setPlannedDurationMin(e.target.value)}
                placeholder="min"
              />
            </div>
            <div className={styles.field}>
              <label>Actual duration (min)</label>
              <input
                type="number"
                min="0"
                value={actualDurationMin}
                onChange={(e) => setActualDurationMin(e.target.value)}
                placeholder="min"
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Exercises completed</h2>
          <p className={styles.hint}>Sets / reps / weight (kg) per exercise</p>
          {rows.map((row, i) => (
            <div key={i} className={styles.exerciseRow}>
              <select
                value={row.exerciseId}
                onChange={(e) => updateRow(i, 'exerciseId', e.target.value)}
              >
                <option value="">Select exercise</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Sets"
                value={row.sets}
                onChange={(e) => updateRow(i, 'sets', e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Reps"
                value={row.reps}
                onChange={(e) => updateRow(i, 'reps', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="kg"
                value={row.weight}
                onChange={(e) => updateRow(i, 'weight', e.target.value)}
              />
              <button type="button" className={styles.removeBtn} onClick={() => removeRow(i)} aria-label="Remove">−</button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addRow}>+ Add exercise</button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How it felt</h2>
          <div className={styles.field}>
            <label>RPE / difficulty (1–10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              placeholder="1–10"
            />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Energy before (1–10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={energyBefore}
                onChange={(e) => setEnergyBefore(e.target.value)}
                placeholder="1–10"
              />
            </div>
            <div className={styles.field}>
              <label>Energy after (1–10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={energyAfter}
                onChange={(e) => setEnergyAfter(e.target.value)}
                placeholder="1–10"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Modifications made</label>
            <textarea
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
              placeholder="Any changes to the plan"
              rows={2}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skipped exercises</h2>
          {skipped.map((s, i) => (
            <div key={i} className={styles.skippedRow}>
              <select
                value={s.exerciseId}
                onChange={(e) => updateSkipped(i, 'exerciseId', e.target.value)}
              >
                <option value="">Exercise</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Reason"
                value={s.reason}
                onChange={(e) => updateSkipped(i, 'reason', e.target.value)}
              />
              <button type="button" className={styles.removeBtn} onClick={() => removeSkipped(i)} aria-label="Remove">−</button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addSkipped}>+ Add skipped</button>
        </section>

        <section className={styles.section}>
          <div className={styles.field}>
            <label>Personal records achieved</label>
            <textarea
              value={prsAchieved}
              onChange={(e) => setPrsAchieved(e.target.value)}
              placeholder="e.g. 24kg swing × 10"
              rows={2}
            />
          </div>
        </section>

        <Button type="submit">{saved ? 'Saved!' : 'Save workout'}</Button>
      </form>

      {workouts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent workouts</h2>
          <ul className={styles.recentList}>
            {workouts.slice(0, 5).map((w) => (
              <li key={w.id} className={styles.recentItem}>
                <span>{new Date(w.completedAt).toLocaleDateString()} – {w.actualDurationMin ?? '?'} min</span>
                <span>{w.exercises?.length ?? 0} exercises</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
