import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import PageHeader from './PageHeader';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import styles from './ResetPasswordPage.module.css';

/**
 * Set new password after following the password-reset link.
 * User lands here from /auth/callback when type=recovery (Supabase has already established session from hash).
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to update password');
      return;
    }
    navigate('/profile', { replace: true, state: { passwordReset: true } });
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.page}>
          <PageHeader title="Loading…" subtitle="Verifying your reset link." />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className={styles.page}>
          <PageHeader title="Invalid or expired link" subtitle="This reset link may have expired. Request a new one from the sign-in page." />
          <Button onClick={() => navigate('/sign-in', { replace: true })}>Back to sign in</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <PageHeader
          title="Set new password"
          subtitle="Enter your new password below."
        />
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="rp-password">New password (min 8 characters)</label>
            <input
              id="rp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rp-confirm">Confirm new password</label>
            <input
              id="rp-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Updating…' : 'Reset password'}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
