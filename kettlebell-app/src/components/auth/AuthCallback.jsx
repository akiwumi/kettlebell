import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../Layout';
import styles from './AuthCallback.module.css';

/**
 * Handles redirect from email verification or password reset link.
 * Route: /auth/callback
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [status, setStatus] = useState('Checking…');

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'recovery') {
      setStatus('You can set a new password in the next step.');
      navigate('/profile', { replace: true });
      return;
    }
    if (session?.user) {
      setStatus('Verification successful. Redirecting…');
      navigate('/', { replace: true });
    } else {
      setStatus('Something went wrong. Redirecting to home…');
      setTimeout(() => navigate('/', { replace: true }), 2000);
    }
  }, [loading, session, navigate]);

  return (
    <Layout>
      <div className={styles.wrap}>
        <p className={styles.text}>{status}</p>
      </div>
    </Layout>
  );
}
