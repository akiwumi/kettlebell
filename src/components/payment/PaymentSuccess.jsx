import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../Layout';
import Button from '../Button';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { refreshSubscriptionStatus, user } = useAuth();

  useEffect(() => {
    if (user?.id) refreshSubscriptionStatus?.();
  }, [user?.id, refreshSubscriptionStatus]);

  useEffect(() => {
    const t = setTimeout(() => navigate('/profile', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <span className={styles.icon} aria-hidden="true">✓</span>
          <h1 className={styles.title}>You&apos;re Pro!</h1>
          <p className={styles.text}>
            Thanks for subscribing. You now have full access to workout plans,
            analytics, AI assistant, custom routines, and more.
          </p>
          <Button as={Link} to="/profile" className={styles.btn}>
            Continue to profile
          </Button>
        </div>
      </div>
    </Layout>
  );
}
