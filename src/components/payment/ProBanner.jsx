import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createCheckoutSession } from '../../lib/stripeClient';
import Button from '../Button';
import styles from './ProBanner.module.css';

export default function ProBanner() {
  const navigate = useNavigate();
  const { user, isPro, loading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (loading || isPro) return null;

  const handleUpgrade = () => {
    if (user) {
      setCheckoutLoading(true);
      createCheckoutSession(user.email).catch(() => setCheckoutLoading(false));
      return;
    }
    navigate('/register');
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
          <Button
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className={styles.cta}
          >
            {checkoutLoading ? 'Redirecting…' : user ? 'Upgrade now' : 'Sign up'}
          </Button>
        </div>
      </section>
  );
}
