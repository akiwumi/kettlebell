import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDailyExercises } from '../lib/dailyRotation';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import ScrollPicker from './ScrollPicker';
import styles from './TimerSetup.module.css';

// Work seconds: 5 to 120 in steps of 5
const WORK_SECONDS_OPTIONS = Array.from({ length: 24 }, (_, i) => 5 + i * 5);
// Rounds: 1 to 10
const ROUNDS_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function TimerSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const exercisesFromState = location.state?.exercises;
  const exercises = useMemo(
    () => (Array.isArray(exercisesFromState) && exercisesFromState.length > 0
      ? exercisesFromState
      : getDailyExercises(new Date(), 6)),
    [exercisesFromState]
  );
  const [workSeconds, setWorkSeconds] = useState(30);
  const [rounds, setRounds] = useState(3);

  const startSession = () => {
    navigate('/get-ready', {
      state: {
        exercises,
        workSeconds: Number(workSeconds) || 30,
        rounds: Number(rounds) || 3,
      },
    });
  };

  // Clamp to options so picker always has a valid value
  const workValue = WORK_SECONDS_OPTIONS.includes(Number(workSeconds))
    ? Number(workSeconds)
    : 30;
  const roundsValue = ROUNDS_OPTIONS.includes(Number(rounds)) ? Number(rounds) : 3;

  return (
    <Layout>
      <div className={styles.setup}>
        <BackLink />
        <PageHeader title="Timer setup" />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Exercises in this routine</h2>
          <ul className={styles.exerciseList}>
            {exercises.map((ex) => (
              <li key={ex.id}>{ex.name}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Work & rounds</h2>
          <p className={styles.pickerHint}>Scroll to set</p>
          <div className={styles.pickersRow}>
            <div className={styles.pickerWrap}>
              <span className={styles.pickerLabel}>Work</span>
              <ScrollPicker
                options={WORK_SECONDS_OPTIONS}
                value={workValue}
                onChange={setWorkSeconds}
                narrow
              />
            </div>
            <div className={styles.pickerWrap}>
              <span className={styles.pickerLabel}>Rnds</span>
              <ScrollPicker
                options={ROUNDS_OPTIONS}
                value={roundsValue}
                onChange={setRounds}
                narrow
              />
            </div>
          </div>
        </section>

        <Button onClick={startSession}>Start session</Button>
      </div>
    </Layout>
  );
}
