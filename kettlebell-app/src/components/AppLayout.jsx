import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { KETTLEBELL_HEADER_LOGO_URL, KETTLEBELL_ICON_URL } from '../lib/constants';
import BottomNav from './BottomNav';
import MenuDrawer from './MenuDrawer';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={styles.wrapper}>
      <header className={styles.topHeader}>
        <img src={KETTLEBELL_HEADER_LOGO_URL} alt="" className={styles.topHeaderLogo} aria-hidden="true" />
      </header>
      <div className={styles.mainBg} aria-hidden="true" />
      <div className={styles.mainOverlay} aria-hidden="true" />
      <main className={styles.main}>
        <div className={styles.mainContent}>
          <Outlet />
        </div>
      </main>
      <BottomNav onMenuClick={() => setMenuOpen(true)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
