import styles from './TimerDisplay.module.css';

// During "Next in" countdown, show numeric countdown only for the last 10 seconds
const COUNTDOWN_SHOW_LAST = 10;

export default function TimerDisplay({ phase, timeLeft, label, variant, phaseLabelOverride }) {
  const phaseLabel = phaseLabelOverride ?? (phase === 'work' ? 'Work' : 'Next in');
  const showCountdownNumber = phase === 'countdown' && timeLeft <= COUNTDOWN_SHOW_LAST;
  const displayTime = phase === 'countdown' ? (showCountdownNumber ? timeLeft : '—') : timeLeft;
  const wrapClass = variant === 'light' ? `${styles.wrap} ${styles.light}` : styles.wrap;
  const timeClass = showCountdownNumber ? `${styles.time} ${styles.timeCountdown}` : styles.time;

  return (
    <div className={wrapClass}>
      <div className={styles.phase}>{phaseLabel}</div>
      <div className={timeClass} aria-live="polite">
        {displayTime}
      </div>
      {label && <h2 className={styles.label}>{label}</h2>}
    </div>
  );
}
