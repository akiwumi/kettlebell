import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../Layout';
import styles from './AuthCallback.module.css';

/**
 * Handles redirect from email verification or password reset link.
 * Route: /auth/callback
 * - type=recovery (from hash or query) → redirect to /reset-password to set new password
 * - email confirmation → redirect to /welcome (Go Pro / Do it later)
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [status, setStatus] = useState('Checking…');

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams((window.location.hash || '').slice(1));
    const type = params.get('type') || hashParams.get('type');

    if (type === 'recovery') {
      setStatus('Taking you to set a new password…');
      navigate('/reset-password', { replace: true });
      return;
    }

    if (session?.user) {
      setStatus('Welcome! Redirecting…');
      navigate('/welcome', { replace: true });
      return;
    }

    setStatus('Something went wrong. Redirecting to home…');
    setTimeout(() => navigate('/', { replace: true }), 2000);
  }, [loading, session, navigate]);

  return (
    <Layout>
      <div className={styles.wrap}>
        <p className={styles.text}>{status}</p>
      </div>
    </Layout>
  );
}
