import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { openBillingPortal } from '../../lib/stripeClient';
import Button from '../Button';
import styles from './ManageSubscription.module.css';

export default function ManageSubscription() {
  const { user, isPro } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user || !isPro) return null;

  const handleManage = async () => {
    setLoading(true);
    try {
      await openBillingPortal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Subscription</h2>
      <p className={styles.text}>
        You have an active Pro subscription. Manage billing, update payment
        method, or cancel from the billing portal.
      </p>
      <Button
        variant="secondary"
        onClick={handleManage}
        disabled={loading}
        className={styles.btn}
      >
        {loading ? 'Opening…' : 'Manage subscription'}
      </Button>
    </section>
  );
}
