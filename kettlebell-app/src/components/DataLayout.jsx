import { Outlet, NavLink } from 'react-router-dom';
import Layout from './Layout';
import styles from './DataLayout.module.css';

const tabs = [
  { to: '/data', end: true, label: 'Overview' },
  { to: '/data/workouts', end: false, label: 'Workout log' },
  { to: '/data/history', end: false, label: 'History' },
  { to: '/data/stats', end: false, label: 'Weekly / Monthly' },
  { to: '/data/body', end: false, label: 'Body metrics' },
  { to: '/data/performance', end: false, label: 'Performance' },
];

export default function DataLayout() {
  return (
    <Layout>
      <nav className={styles.tabs} aria-label="Data sections">
        {tabs.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </Layout>
  );
}
