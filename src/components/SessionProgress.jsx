import styles from './SessionProgress.module.css';

export default function SessionProgress({ roundIndex, rounds, exerciseIndex, totalExercises }) {
  return (
    <div className={styles.progress}>
      Round {roundIndex + 1} / {rounds} · Exercise {exerciseIndex + 1} / {totalExercises}
    </div>
  );
}
