import { useStripeCheckout } from '../../lib/stripeClient';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../Button';
import styles from './PaywallOverlay.module.css';

const FEATURE_LABELS = {
  custom_routines: 'Custom routines & My Routines',
  analytics: 'Analytics & progress tracking',
  data_tracking: 'Workout log & history',
  body_metrics: 'Body metrics',
  performance: 'Performance & PRs',
  schedule: 'Schedule & reminders',
  goals: 'Goal setting',
  ai_assistant: 'AI Assistant',
  share: 'Share with friends',
  full_profile: 'Full profile & preferences',
};

export default function PaywallOverlay({
  feature = 'analytics',
  title,
  description,
  onDismiss,
  onSignUpFirst,
}) {
  const { user } = useAuth();
  const { goToCheckout, loading } = useStripeCheckout();
  const displayTitle = title ?? FEATURE_LABELS[feature] ?? 'Pro feature';
  const displayDesc =
    description ??
    'Unlock this and all Pro features with a €3/month subscription.';

  const handleGoPro = () => {
    if (!user) {
      onSignUpFirst?.();
      return;
    }
    if (user.email) goToCheckout(user.email);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <span className={styles.lock} aria-hidden="true">🔒</span>
        <h3 className={styles.title}>{displayTitle}</h3>
        <p className={styles.desc}>{displayDesc}</p>
        <Button onClick={handleGoPro} disabled={loading} className={styles.cta}>
          {user ? 'Go Pro — €3/month' : 'Sign up & go Pro'}
        </Button>
        {onDismiss && (
          <button type="button" className={styles.dismiss} onClick={onDismiss}>
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}
