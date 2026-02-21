import { useNavigate, useLocation } from 'react-router-dom';
import { KETTLEBELL_ICON_URL } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import styles from './MenuDrawer.module.css';

const menuSections = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Home' },
      { to: '/routine', label: 'Choose routine' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/timer-setup', label: 'Start session' },
      { to: '/ai-assistant', label: '🤖 AI Assistant' },
    ],
  },
  {
    label: 'Progress & charts',
    items: [
      { to: '/progress', label: 'Weight over time' },
      { to: '/progress', label: 'Body measurements over time' },
      { to: '/progress', label: 'Volume progression' },
      { to: '/progress', label: 'Workout frequency (heat map)' },
      { to: '/progress', label: 'Strength gains per exercise' },
      { to: '/progress', label: 'Goal progress meter' },
    ],
  },
  {
    label: 'Summary dashboard',
    items: [
      { to: '/dashboard', label: 'Current streak' },
      { to: '/dashboard', label: 'Workouts this week/month' },
      { to: '/dashboard', label: 'Progress toward goal' },
      { to: '/dashboard', label: 'Recent achievements' },
      { to: '/dashboard', label: 'Next milestone' },
      { to: '/dashboard', label: 'Adherence rate' },
      { to: '/dashboard', label: 'Total training time' },
      { to: '/dashboard', label: 'Current vs. starting stats' },
    ],
  },
  {
    label: 'Data & tracking',
    items: [
      { to: '/data', label: 'Data' },
      { to: '/data/workouts', label: 'Workout log' },
      { to: '/data/history', label: 'Workout history' },
      { to: '/data/stats', label: 'Weekly / Monthly' },
      { to: '/data/body', label: 'Body metrics' },
      { to: '/data/performance', label: 'Performance' },
    ],
  },
  {
    label: 'Schedule & reminders',
    items: [
      { to: '/schedule', label: 'Workout schedule / calendar' },
      { to: '/schedule', label: 'Rest day markers' },
      { to: '/schedule', label: 'Reminder notifications' },
      { to: '/schedule', label: 'Deload week scheduling' },
      { to: '/schedule', label: 'Progress check-in reminders' },
    ],
  },
  {
    label: 'Community & more',
    items: [
      { to: '/community', label: 'Share achievements' },
      { to: '/community', label: 'Workout history sharing' },
      { to: '/community', label: 'Challenge friends' },
      { to: '/community', label: 'Leaderboards' },
      { to: '/profile', label: 'Profile' },
      { to: '/library', label: 'Exercises' },
    ],
  },
];

export default function MenuDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { adminLogout } = useAdmin();

  const handleNav = (to) => {
    if (location.pathname !== to) {
      navigate(to);
    }
    onClose();
  };

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const handleLogout = async () => {
    adminLogout();
    await signOut();
    onClose();
    navigate('/');
  };

  return (
    <>
      <div
        className={open ? `${styles.overlay} ${styles.overlayOpen}` : styles.overlay}
        aria-hidden={!open}
        onClick={onClose}
      />
      <div
        className={open ? `${styles.sheet} ${styles.sheetOpen}` : styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <div className={styles.headerCenter}>
            <img src={KETTLEBELL_ICON_URL} alt="" className={styles.headerIcon} aria-hidden="true" />
            <h2 className={styles.title}>Menu</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className={styles.scroll}>
          {menuSections.map((section) => (
            <div key={section.label} className={styles.section}>
              <div className={styles.sectionLabel}>{section.label}</div>
              <ul className={styles.menuList}>
                {section.items.map(({ to, label }, i) => (
                  <li key={`${section.label}-${i}-${label}`}>
                    <button
                      type="button"
                      className={isActive(to) ? `${styles.menuLink} ${styles.menuLinkActive}` : styles.menuLink}
                      onClick={() => handleNav(to)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {user && (
          <div className={styles.logoutSection}>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
