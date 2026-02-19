import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from './PageHeader';
import ProGate from './payment/ProGate';
import { getWorkouts, getBodyMetrics } from '../lib/trackingStorage';
import styles from './Progress.module.css';

const PROFILE_KEY = 'kettlebell-profile';

function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

const MEASUREMENT_KEYS = ['chest', 'waist', 'hips', 'arms', 'thighs', 'calves'];

export default function Progress() {
  const [measurementSelect, setMeasurementSelect] = useState('waist');

  const { weightData, measurementData, volumeByWeek, heatmapData, strengthByExercise, goalProgress } = useMemo(() => {
    const workouts = getWorkouts();
    const body = getBodyMetrics();
    const profile = loadProfile();
    const targetWeight = profile.targetWeight ? parseFloat(profile.targetWeight) : null;
    const startWeight = body.length ? (body[body.length - 1].weight != null ? parseFloat(body[body.length - 1].weight) : null) : (profile.weight ? parseFloat(profile.weight) : null);
    const currentWeight = body.length && body[0].weight != null ? parseFloat(body[0].weight) : (profile.weight ? parseFloat(profile.weight) : null);

    const weightData = body
      .filter((b) => b.weight != null && b.weight !== '')
      .map((b) => ({ date: b.date, weight: parseFloat(b.weight) }))
      .reverse();

    const measurementData = body
      .filter((b) => b[measurementSelect] != null && b[measurementSelect] !== '')
      .map((b) => ({ date: b.date, [measurementSelect]: parseFloat(b[measurementSelect]) }))
      .reverse();

    const weekMap = {};
    workouts.forEach((w) => {
      const d = new Date(w.completedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
      const key = weekStart.toISOString().slice(0, 10);
      if (!weekMap[key]) weekMap[key] = { week: key, volume: 0, count: 0 };
      const vol = (w.exercises || []).reduce((s, e) => {
        const sets = e.sets || 1;
        const reps = e.reps || 0;
        const weight = e.weight || 0;
        return s + sets * reps * weight;
      }, 0);
      weekMap[key].volume += vol;
      weekMap[key].count += 1;
    });
    const volumeByWeek = Object.values(weekMap)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);

    const dayCount = {};
    workouts.forEach((w) => {
      const key = new Date(w.completedAt).toISOString().slice(0, 10);
      dayCount[key] = (dayCount[key] || 0) + 1;
    });
    const today = new Date();
    const heatmapDays = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      heatmapDays.push({ date: key, count: dayCount[key] || 0 });
    }

    const exerciseVolume = {};
    workouts.forEach((w) => {
      (w.exercises || []).forEach((e) => {
        const id = e.exerciseId || e.exerciseName || 'Unknown';
        const name = e.exerciseName || id;
        if (!exerciseVolume[name]) exerciseVolume[name] = [];
        const vol = (e.sets || 1) * (e.reps || 0) * (e.weight || 0);
        exerciseVolume[name].push({ date: w.completedAt, volume: vol });
      });
    });
    const strengthByExercise = Object.entries(exerciseVolume).map(([name, points]) => {
      const sorted = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));
      return { name, data: sorted.map((p) => ({ date: p.date.slice(0, 10), volume: p.volume })) };
    }).filter((e) => e.data.length >= 2).slice(0, 5);

    let goalProgress = null;
    if (targetWeight != null && startWeight != null && currentWeight != null) {
      const range = Math.abs(startWeight - targetWeight);
      if (range > 0) {
        const moved = Math.abs(currentWeight - startWeight);
        goalProgress = Math.round(Math.min(100, (moved / range) * 100));
      }
    }

    return {
      weightData,
      measurementData,
      volumeByWeek,
      heatmapData,
      strengthByExercise,
      goalProgress,
    };
  }, [measurementSelect]);

  const heatmapGrid = useMemo(() => {
    const rows = [];
    const cols = 7;
    for (let i = 0; i < 13; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const idx = i * cols + j;
        row.push(heatmapData[idx] || { date: '', count: 0 });
      }
      rows.push(row);
    }
    return rows;
  }, [heatmapData]);

  return (
    <ProGate feature="analytics" title="Progress & charts" description="View weight, volume, strength and goal charts with Pro.">
    <>
      <PageHeader title="Progress visualization" subtitle="Charts and graphs" />
      <div className={styles.scroll}>
        {weightData.length > 0 && (
          <section className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Weight over time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(0, 7)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="var(--accent-orange)" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {measurementData.length > 0 && (
          <section className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Body measurement over time</h3>
            <select
              className={styles.select}
              value={measurementSelect}
              onChange={(e) => setMeasurementSelect(e.target.value)}
              aria-label="Select measurement"
            >
              {MEASUREMENT_KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={measurementData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(0, 7)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey={measurementSelect} stroke="var(--accent-indigo)" strokeWidth={2} dot={{ r: 3 }} name={`${measurementSelect} (cm)`} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {volumeByWeek.length > 0 && (
          <section className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Volume progression by week</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeByWeek} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} tickFormatter={(v) => v ? v.slice(5, 10) : ''} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="volume" fill="var(--accent-orange)" name="Volume (kg)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        <section className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Workout frequency (last ~90 days)</h3>
          <div className={styles.heatmapWrap} role="img" aria-label="Workout frequency heat map">
            {heatmapGrid.map((row, i) => (
              <div key={i} className={styles.heatmapRow}>
                {row.map((cell, j) => (
                  <div
                    key={j}
                    className={styles.heatmapCell}
                    style={{
                      backgroundColor: cell.count === 0 ? 'var(--bg-card-soft)' : cell.count === 1 ? 'rgba(245, 158, 11, 0.4)' : 'var(--accent-orange)',
                    }}
                    title={`${cell.date}: ${cell.count} workout(s)`}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className={styles.heatmapLegend}>Less → More</p>
        </section>

        {strengthByExercise.length > 0 && (
          <section className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Strength gains per exercise (volume)</h3>
            {strengthByExercise.map(({ name, data }) => (
              <div key={name} className={styles.miniChart}>
                <p className={styles.exerciseName}>{name}</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v?.slice(5)} hide />
                    <YAxis tick={{ fontSize: 9 }} width={28} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="volume" stroke="var(--accent-teal)" strokeWidth={1.5} dot={{ r: 2 }} name="Volume" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </section>
        )}

        {goalProgress != null && (
          <section className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Goal progress</h3>
            <div className={styles.meterWrap}>
              <div className={styles.meterBar} style={{ width: `${goalProgress}%` }} />
            </div>
            <p className={styles.percent}>{goalProgress}% toward goal</p>
          </section>
        )}

        {weightData.length === 0 && measurementData.length === 0 && volumeByWeek.length === 0 && goalProgress == null && (
          <p className={styles.empty}>Log workouts and body metrics to see charts here.</p>
        )}
      </div>
    </>
    </ProGate>
  );
}
