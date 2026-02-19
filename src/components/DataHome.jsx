import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';
import ProGate from './payment/ProGate';
import styles from './DataHome.module.css';

const cards = [
  { to: '/data/workouts', title: 'Workout log', desc: 'Log each workout: duration, exercises, sets/reps/weight, RPE, energy, PRs.' },
  { to: '/data/history', title: 'Workout history', desc: 'Full table of all logged workouts – date, duration, exercises, volume, RPE, modifications, PRs.' },
  { to: '/data/stats', title: 'Weekly / Monthly', desc: 'Total workouts, adherence %, volume, favorite exercises, training time.' },
  { to: '/data/body', title: 'Body metrics', desc: 'Weight, measurements, progress photos, body fat %, how clothes fit.' },
  { to: '/data/performance', title: 'Performance', desc: 'Strength & endurance progression, PRs, volume over time.' },
];

export default function DataHome() {
  return (
    <ProGate feature="data_tracking" title="Data & tracking" description="Log workouts, body metrics, and performance with Pro.">
      <PageHeader title="Progression tracking" subtitle="Track workouts, body metrics, and performance" />
      <div className={styles.grid}>
        {cards.map(({ to, title, desc }) => (
          <Link key={to} to={to} className={styles.card}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDesc}>{desc}</p>
          </Link>
        ))}
      </div>
    </ProGate>
  );
}
