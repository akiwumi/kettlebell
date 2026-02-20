import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { createCheckoutSession } from '../../lib/stripeClient';
import Button from '../Button';
import styles from './ProBanner.module.css';

export default function ProBanner() {
  const { user, isPro, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (loading || isPro || isAdmin) return null;

  const handleUpgrade = () => {
    if (user) {
      setCheckoutLoading(true);
      createCheckoutSession(user.email).catch(() => setCheckoutLoading(false));
    }
  };

  return (
    <section className={styles.banner} aria-label="Upgrade to Pro">
        <div className={styles.content}>
          <span className={styles.badge}>🚀 Go Pro</span>
          <h2 className={styles.title}>
            {user
              ? 'Unlock all features — €3/month'
              : 'Sign up for free — upgrade to Pro anytime'}
          </h2>
          <p className={styles.desc}>
            {user
              ? 'Workout plans, full analytics, AI assistant, custom routines & more.'
              : 'Create an account to save progress. Upgrade to Pro from Profile when you’re ready.'}
          </p>
          {user ? (
            <Button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className={styles.cta}
            >
              {checkoutLoading ? 'Redirecting…' : 'Upgrade now'}
            </Button>
          ) : (
            <Link to="/sign-in" className={styles.loginLink}>Log in</Link>
          )}
        </div>
      </section>
  );
}
