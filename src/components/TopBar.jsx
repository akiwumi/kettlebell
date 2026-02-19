import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './TopBar.module.css';

const menuSections = [
  { label: 'Main', items: [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/timer-setup', label: 'Start session' },
  ]},
  { label: 'Tracking', items: [
    { to: '/data', label: 'Data' },
    { to: '/data/workouts', label: 'Workout log' },
    { to: '/data/stats', label: 'Weekly / Monthly' },
    { to: '/data/body', label: 'Body metrics' },
    { to: '/data/performance', label: 'Performance' },
    { to: '/progress', label: 'Charts & progress' },
  ]},
  { label: 'Planning', items: [
    { to: '/schedule', label: 'Schedule & reminders' },
  ]},
  { label: 'More', items: [
    { to: '/profile', label: 'Profile' },
    { to: '/library', label: 'Exercises' },
    { to: '/community', label: 'Community' },
  ]},
];

function HamburgerIcon({ open }) {
  return (
    <span className={styles.hamburger} aria-hidden="true">
      <span className={open ? styles.barOpen1 : styles.bar} />
      <span className={open ? styles.barOpen2 : styles.bar} />
      <span className={open ? styles.barOpen3 : styles.bar} />
    </span>
  );
}

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleNav = (to) => {
    navigate(to);
    closeMenu();
  };

  return (
    <>
      <header className={styles.bar} role="banner">
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="app-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
        <Link to="/" className={styles.title} onClick={closeMenu}>
          Kettlebell Gym
        </Link>
        <span className={styles.spacer} />
      </header>

      <div
        id="app-menu"
        className={menuOpen ? `${styles.overlay} ${styles.overlayOpen}` : styles.overlay}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      >
        <nav
          className={menuOpen ? `${styles.drawer} ${styles.drawerOpen}` : styles.drawer}
          onClick={(e) => e.stopPropagation()}
          role="navigation"
          aria-label="Main menu"
        >
          {menuSections.map((section) => (
            <div key={section.label} className={styles.section}>
              <div className={styles.sectionLabel}>{section.label}</div>
              <ul className={styles.menuList}>
                {section.items.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        isActive ? `${styles.menuLink} ${styles.menuLinkActive}` : styles.menuLink
                      }
                      end={to === '/'}
                      onClick={() => handleNav(to)}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
