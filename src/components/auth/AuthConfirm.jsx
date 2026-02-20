import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Layout from '../Layout';
import styles from './AuthCallback.module.css';

/**
 * Handles auth confirmation (e.g. OAuth or email link redirect).
 * Listens for SIGNED_IN; then redirects to home.
 * Route: /auth/confirm
 */
export default function AuthConfirm() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) {
        navigate('/', { replace: true });
        return;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!cancelled && event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Layout>
      <div className={styles.wrap}>
        <p className={styles.text}>Confirming your account…</p>
      </div>
    </Layout>
  );
}
