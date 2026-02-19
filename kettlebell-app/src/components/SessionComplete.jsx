import { Link } from 'react-router-dom';
import styles from './SessionComplete.module.css';

export default function SessionComplete({ rounds, totalExercises }) {
  return (
    <div className={styles.done}>
      <h2>Session complete</h2>
      <p>
        {rounds} round{rounds !== 1 ? 's' : ''} × {totalExercises} exercises
      </p>
      <Link to="/" className={styles.link}>
        Back to home
      </Link>
    </div>
  );
}
