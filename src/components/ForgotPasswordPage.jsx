import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to send reset email');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Layout>
        <div className={styles.page}>
          <BackLink />
          <PageHeader title="Check your email" />
          <p className={styles.text}>
            If an account exists for <strong>{email}</strong>, we sent a password
            reset link. Click the link in that email to set a new password.
          </p>
          <Button onClick={() => navigate('/sign-in', { replace: true })} className={styles.btn}>
            Back to sign in
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <BackLink />
        <PageHeader
          title="Forgot password?"
          subtitle="Enter your email and we'll send you a link to reset your password."
        />
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <p className={styles.back}>
            <Link to="/sign-in">Back to sign in</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
