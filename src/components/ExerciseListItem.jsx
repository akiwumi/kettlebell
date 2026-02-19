import { useState } from 'react';
import CueList from './CueList';
import styles from './ExerciseListItem.module.css';

export default function ExerciseListItem({ exercise, showTodayBadge = false }) {
  const [open, setOpen] = useState(false);

  const meta = exercise.defaultReps
    ? `${exercise.defaultReps} reps`
    : `${exercise.defaultSeconds}s`;
  const extra = exercise.side ? ' · each side' : '';

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.head}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.name}>{exercise.name}</span>
        {showTodayBadge && <span className={styles.badge}>Today</span>}
        <span className={styles.chevron}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className={styles.body}>
          <p className={styles.meta}>
            {meta}
            {extra}
          </p>
          <CueList cues={exercise.cues} />
        </div>
      )}
    </li>
  );
}
