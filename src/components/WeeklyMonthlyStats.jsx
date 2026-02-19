import { getWorkouts } from '../lib/trackingStorage';
import PageHeader from './PageHeader';
import styles from './WeeklyMonthlyStats.module.css';

function getWeekBounds(weeksAgo = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - 7 * weeksAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthBounds(monthsAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default function WeeklyMonthlyStats() {
  const workouts = getWorkouts();

  const inRange = (w, start, end) => {
    const t = new Date(w.completedAt).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const thisWeek = getWeekBounds(0);
  const lastWeek = getWeekBounds(1);
  const thisMonth = getMonthBounds(0);
  const lastMonth = getMonthBounds(1);

  const wThisWeek = workouts.filter((w) => inRange(w, thisWeek.start, thisWeek.end));
  const wLastWeek = workouts.filter((w) => inRange(w, lastWeek.start, lastWeek.end));
  const wThisMonth = workouts.filter((w) => inRange(w, thisMonth.start, thisMonth.end));
  const wLastMonth = workouts.filter((w) => inRange(w, lastMonth.start, lastMonth.end));

  const totalVolume = (list) =>
    list.reduce(
      (sum, w) =>
        sum +
        (w.exercises || []).reduce(
          (s, e) => s + (e.sets || 0) * (e.reps || 0) * (e.weight || 0),
          0
        ),
      0
    );

  const totalDuration = (list) =>
    list.reduce((sum, w) => sum + (w.actualDurationMin || 0), 0);

  const avgDuration = (list) =>
    list.length ? Math.round(totalDuration(list) / list.length) : 0;

  const exerciseCounts = (list) => {
    const map = {};
    (list || []).forEach((w) => {
      (w.exercises || []).forEach((e) => {
        const name = e.exerciseName || e.exerciseId;
        map[name] = (map[name] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  return (
    <>
      <PageHeader title="Weekly / Monthly tracking" subtitle="Totals and adherence" />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>This week</h2>
        <ul className={styles.stats}>
          <li><span>Workouts completed</span><strong>{wThisWeek.length}</strong></li>
          <li><span>Total training time</span><strong>{totalDuration(wThisWeek)} min</strong></li>
          <li><span>Average duration</span><strong>{avgDuration(wThisWeek)} min</strong></li>
          <li><span>Total volume (sets×reps×kg)</span><strong>{totalVolume(wThisWeek).toLocaleString()}</strong></li>
        </ul>
        <h3 className={styles.subTitle}>Most frequent exercises (this week)</h3>
        <ul className={styles.freqList}>
          {exerciseCounts(wThisWeek).length ? exerciseCounts(wThisWeek).map(([name, count]) => (
            <li key={name}>{name} <span>{count}</span></li>
          )) : <li className={styles.empty}>No exercises logged yet</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Last week</h2>
        <ul className={styles.stats}>
          <li><span>Workouts completed</span><strong>{wLastWeek.length}</strong></li>
          <li><span>Total training time</span><strong>{totalDuration(wLastWeek)} min</strong></li>
          <li><span>Average duration</span><strong>{avgDuration(wLastWeek)} min</strong></li>
          <li><span>Total volume</span><strong>{totalVolume(wLastWeek).toLocaleString()}</strong></li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>This month</h2>
        <ul className={styles.stats}>
          <li><span>Workouts completed</span><strong>{wThisMonth.length}</strong></li>
          <li><span>Total training time</span><strong>{totalDuration(wThisMonth)} min</strong></li>
          <li><span>Average duration</span><strong>{avgDuration(wThisMonth)} min</strong></li>
          <li><span>Total volume</span><strong>{totalVolume(wThisMonth).toLocaleString()}</strong></li>
        </ul>
        <h3 className={styles.subTitle}>Favorite exercises (this month)</h3>
        <ul className={styles.freqList}>
          {exerciseCounts(wThisMonth).length ? exerciseCounts(wThisMonth).map(([name, count]) => (
            <li key={name}>{name} <span>{count}</span></li>
          )) : <li className={styles.empty}>No exercises logged yet</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adherence</h2>
        <p className={styles.hint}>Compare completed vs planned. Log workouts with planned duration to see adherence %.</p>
        <ul className={styles.stats}>
          <li><span>This week</span><strong>{wThisWeek.length} workouts</strong></li>
          <li><span>This month</span><strong>{wThisMonth.length} workouts</strong></li>
        </ul>
      </section>
    </>
  );
}
