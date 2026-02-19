import styles from './ExerciseCard.module.css';

export default function ExerciseCard({ exercise, showBadge = false }) {
  const meta = exercise.defaultReps
    ? `${exercise.defaultReps} reps`
    : `${exercise.defaultSeconds}s`;
  const extra = exercise.side ? ' · each side' : '';

  return (
    <div className={styles.card}>
      <span className={styles.name}>{exercise.name}</span>
      <span className={styles.meta}>
        {meta}
        {extra}
      </span>
      {showBadge && <span className={styles.badge}>Today</span>}
    </div>
  );
}
