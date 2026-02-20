import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import styles from './AuthCallback.module.css';

/**
 * Handles redirect from password reset email link.
 * Route: /auth/reset
 * Supabase redirects here with token in hash; client picks up session, then we send user to set new password.
 */
export default function AuthReset() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/reset-password', { replace: true });
  }, [navigate]);

  return (
    <Layout>
      <div className={styles.wrap}>
        <p className={styles.text}>Taking you to set a new password…</p>
      </div>
    </Layout>
  );
}
