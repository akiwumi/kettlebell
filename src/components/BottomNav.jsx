import { NavLink } from 'react-router-dom';
import { KETTLEBELL_ICON_URL } from '../lib/constants';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
  { to: '/data', label: 'Data', icon: DataIcon },
  { to: '/library', label: 'Exercises', icon: ExercisesIcon },
  { type: 'menu', label: 'Menu', icon: MenuIcon },
];

const iconSize = 22;

function MenuIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ExercisesIcon() {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}

export default function BottomNav({ onMenuClick }) {
  return (
    <nav className={styles.nav} role="navigation" aria-label="Main">
      {navItems.map((item) => {
        if (item.type === 'menu') {
          const Icon = item.icon;
          return (
            <button
              key="menu"
              type="button"
              className={styles.link}
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <span className={styles.icon}><Icon /></span>
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        }
        const { to, label, icon: Icon } = item;
        const isHome = to === '/';
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            end={isHome}
          >
            <span className={styles.icon}>
              {isHome ? (
                <img src={KETTLEBELL_ICON_URL} alt="" width={iconSize} height={iconSize} className={styles.iconImg} aria-hidden="true" />
              ) : (
                <Icon />
              )}
            </span>
            <span className={styles.label}>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
