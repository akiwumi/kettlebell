import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';
import ProGate from './payment/ProGate';
import { getWorkouts, getBodyMetrics } from '../lib/trackingStorage';
import styles from './Dashboard.module.css';

const PROFILE_KEY = 'kettlebell-profile';

function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function computeStreak(workouts) {
  const days = [...new Set(workouts.map((w) => startOfDay(new Date(w.completedAt))))].sort((a, b) => b - a);
  if (days.length === 0) return 0;
  const today = startOfDay(Date.now());
  if (days[0] !== today && days[0] !== today - 86400000) return 0;
  let streak = 0;
  let expect = days[0];
  for (const d of days) {
    if (d !== expect) break;
    streak++;
    expect -= 86400000;
  }
  return streak;
}

function totalMinutes(workouts) {
  return workouts.reduce((sum, w) => sum + (w.actualDurationMin || w.plannedDurationMin || 0), 0);
}

export default function Dashboard() {
  const stats = useMemo(() => {
    const workouts = getWorkouts();
    const body = getBodyMetrics();
    const profile = loadProfile();
    const now = Date.now();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const workoutsThisWeek = workouts.filter((w) => new Date(w.completedAt).getTime() >= weekStart).length;
    const workoutsThisMonth = workouts.filter((w) => new Date(w.completedAt).getTime() >= monthStart).length;
    const streak = computeStreak(workouts);
    const totalTimeMin = totalMinutes(workouts);
    const targetWeight = profile.targetWeight ? parseFloat(profile.targetWeight) : null;
    const currentWeight = body.length ? (body[0].weight != null ? parseFloat(body[0].weight) : null) : (profile.weight ? parseFloat(profile.weight) : null);
    const startWeight = body.length ? (body[body.length - 1].weight != null ? parseFloat(body[body.length - 1].weight) : null) : (profile.weight ? parseFloat(profile.weight) : null);
    const goalProgress = targetWeight != null && startWeight != null && currentWeight != null
      ? Math.round(Math.max(0, Math.min(100, (Math.abs(startWeight - currentWeight) / Math.abs(startWeight - targetWeight)) * 100)))
      : null;
    const daysPerWeek = profile.trainingDaysPerWeek ? parseInt(profile.trainingDaysPerWeek, 10) : 3;
    const weeksInMonth = 4;
    const plannedPerMonth = daysPerWeek * weeksInMonth;
    const adherence = plannedPerMonth > 0 ? Math.round((workoutsThisMonth / plannedPerMonth) * 100) : null;

    const milestones = [
      { name: 'First workout', done: workouts.length >= 1 },
      { name: '5 workouts', done: workouts.length >= 5 },
      { name: '10 workouts', done: workouts.length >= 10 },
      { name: '7-day streak', done: streak >= 7 },
      { name: '30 workouts', done: workouts.length >= 30 },
    ];
    const nextMilestone = milestones.find((m) => !m.done) || milestones[milestones.length - 1];
    const recentAchievements = milestones.filter((m) => m.done).slice(-3).reverse();

    return {
      streak,
      workoutsThisWeek,
      workoutsThisMonth,
      totalTimeMin,
      goalProgress,
      adherence,
      currentWeight,
      startWeight,
      targetWeight,
      nextMilestone,
      recentAchievements,
      totalWorkouts: workouts.length,
    };
  }, []);

  return (
    <ProGate feature="analytics" title="Summary dashboard" description="View streak, adherence, and milestones with Pro.">
    <>
      <PageHeader title="Summary dashboard" subtitle="Your progress at a glance" />
      <div className={styles.grid}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Current streak</h3>
          <p className={styles.bigNumber}>{stats.streak}</p>
          <p className={styles.unit}>days</p>
        </section>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>This week</h3>
          <p className={styles.bigNumber}>{stats.workoutsThisWeek}</p>
          <p className={styles.unit}>workouts</p>
        </section>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>This month</h3>
          <p className={styles.bigNumber}>{stats.workoutsThisMonth}</p>
          <p className={styles.unit}>workouts</p>
        </section>
        {stats.goalProgress != null && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Progress toward goal</h3>
            <div className={styles.meterWrap}>
              <div className={styles.meterBar} style={{ width: `${stats.goalProgress}%` }} />
            </div>
            <p className={styles.percent}>{stats.goalProgress}%</p>
          </section>
        )}
        {stats.adherence != null && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Adherence rate</h3>
            <p className={styles.bigNumber}>{Math.min(100, stats.adherence)}</p>
            <p className={styles.unit}>%</p>
          </section>
        )}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Total training time</h3>
          <p className={styles.bigNumber}>{Math.round(stats.totalTimeMin / 60)}</p>
          <p className={styles.unit}>hours</p>
        </section>
        {(stats.currentWeight != null || stats.startWeight != null) && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Current vs starting</h3>
            <p className={styles.statLine}>
              <span>Starting</span> <strong>{stats.startWeight ?? '—'} kg</strong>
            </p>
            <p className={styles.statLine}>
              <span>Current</span> <strong>{stats.currentWeight ?? '—'} kg</strong>
            </p>
          </section>
        )}
        {stats.recentAchievements.length > 0 && (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Recent achievements</h3>
            <ul className={styles.achievementList}>
              {stats.recentAchievements.map((m) => (
                <li key={m.name}>✓ {m.name}</li>
              ))}
            </ul>
          </section>
        )}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Next milestone</h3>
          <p className={styles.milestone}>{stats.nextMilestone?.name}</p>
          {!stats.nextMilestone?.done && <p className={styles.hint}>Keep logging workouts to unlock it.</p>}
        </section>
      </div>
      <div className={styles.links}>
        <Link to="/community" className={styles.link}>Share with friends</Link>
        <Link to="/progress" className={styles.link}>Charts & progress</Link>
        <Link to="/data" className={styles.link}>Log workout / body data</Link>
      </div>
    </>
    </ProGate>
  );
}
