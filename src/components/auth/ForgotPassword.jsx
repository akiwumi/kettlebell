import { useState } from 'react';
import Button from '../Button';
import styles from './ForgotPassword.module.css';

export default function ForgotPassword({ onClose, onBack, resetPassword }) {
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
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>Check your email</h2>
          <p className={styles.text}>
            If an account exists for <strong>{email}</strong>, we sent a password
            reset link. Click the link in that email to set a new password.
          </p>
          <Button onClick={onClose} className={styles.btn}>
            OK
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Forgot password?</h2>
        <p className={styles.subtitle}>
          Enter your email and we’ll send you a link to reset your password.
        </p>
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
          <button type="button" className={styles.back} onClick={onBack}>
            Back to sign in
          </button>
        </form>
      </div>
    </div>
  );
}
