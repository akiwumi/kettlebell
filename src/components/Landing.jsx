import { useCallback } from 'react';
import { KETTLEBELL_ICON_URL } from '../lib/constants';
import styles from './Landing.module.css';

const TAGLINE = 'Your pocket coach for kettlebell routines, timers, and progress.';
const LOGO_SRC = '/exercise-media/images/logos/kettlebell_mastery_logo.png';

export default function Landing({ visible, onTap }) {
  const handleTap = useCallback(() => {
    if (visible) onTap?.();
  }, [visible, onTap]);

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.visible : styles.dismissed}`}
      onClick={handleTap}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTap(); }}
      role="button"
      tabIndex={0}
      aria-label="Tap to continue to app"
    >
      <div className={styles.content}>
        <img
          src={LOGO_SRC}
          alt="Kettlebell Mastery"
          className={styles.logo}
        />
        <p className={styles.tagline}>{TAGLINE}</p>
        <p className={styles.cta}>Tap screen to continue</p>
        <img src={KETTLEBELL_ICON_URL} alt="" className={styles.footerIcon} aria-hidden="true" />
      </div>
    </div>
  );
}
