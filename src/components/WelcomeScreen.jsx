import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../lib/stripeClient';
import styles from './WelcomeScreen.module.css';

/**
 * Shown after email confirmation. Welcome message with Go Pro or Do it later.
 */
export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { user, isPro } = useAuth();

  const handleGoPro = () => {
    if (user?.email && !isPro) {
      createCheckoutSession(user.email).catch(() => {});
      return;
    }
    navigate('/profile', { replace: true });
  };

  const handleLater = () => {
    navigate('/', { replace: true });
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Welcome to Kettlebell Mastery</h1>
          <p className={styles.subtitle}>
            Your account is confirmed. You’re all set to track workouts and progress.
          </p>
          <div className={styles.actions}>
            {!isPro && (
              <Button onClick={handleGoPro} className={styles.primaryBtn}>
                Go Pro — €3/month
              </Button>
            )}
            <Button onClick={handleLater} variant="secondary" className={styles.secondaryBtn}>
              {isPro ? 'Continue to home' : 'Do it later'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
