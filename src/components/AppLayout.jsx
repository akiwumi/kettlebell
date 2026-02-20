import { useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { KETTLEBELL_HEADER_LOGO_URL } from '../lib/constants';
import { useReset } from '../App';
import BottomNav from './BottomNav';
import MenuDrawer from './MenuDrawer';
import styles from './AppLayout.module.css';

const PULL_THRESHOLD_PX = 70;

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { resetApp } = useReset() || {};
  const mainContentRef = useRef(null);
  const pullStartY = useRef(0);
  const pullFired = useRef(false);
  const mouseDown = useRef(false);

  const getClientY = (e) => e.touches?.[0]?.clientY ?? e.clientY;

  const handlePullStart = useCallback(() => {
    pullFired.current = false;
  }, []);

  const handlePullMove = useCallback((e) => {
    if (!resetApp || !mainContentRef.current || pullFired.current) return;
    if (e.touches == null && !mouseDown.current) return;
    const el = mainContentRef.current;
    if (el.scrollTop > 0) return;
    const y = getClientY(e);
    if (y - pullStartY.current >= PULL_THRESHOLD_PX) {
      pullFired.current = true;
      resetApp();
    }
  }, [resetApp]);

  const handlePointerDown = useCallback((e) => {
    pullStartY.current = getClientY(e);
    if (e.touches == null) mouseDown.current = true;
    handlePullStart();
  }, [handlePullStart]);

  const handlePointerEnd = useCallback(() => {
    pullStartY.current = 0;
    mouseDown.current = false;
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.topHeader}>
        <button
          type="button"
          className={styles.logoButton}
          onClick={resetApp}
          aria-label="Reset app / go home"
        >
          <img src={KETTLEBELL_HEADER_LOGO_URL} alt="" className={styles.topHeaderLogo} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.mainBg} aria-hidden="true" />
      <div className={styles.mainOverlay} aria-hidden="true" />
      <main className={styles.main}>
        <div
          ref={mainContentRef}
          className={styles.mainContent}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePullMove}
          onTouchEnd={handlePointerEnd}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePullMove}
          onMouseLeave={handlePointerEnd}
          onMouseUp={handlePointerEnd}
        >
          <Outlet />
        </div>
      </main>
      <BottomNav onMenuClick={() => setMenuOpen(true)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
