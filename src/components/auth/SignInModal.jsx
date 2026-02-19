import { useState } from 'react';
import Button from '../Button';
import styles from './SignInModal.module.css';

export default function SignInModal({
  onClose,
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
  signIn,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message || 'Sign in failed');
      return;
    }
    if (data?.user) {
      onSuccess?.();
      onClose?.();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.subtitle}>
          Enter your email and password to continue.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="button"
            className={styles.forgot}
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <button
            type="button"
            className={styles.switch}
            onClick={onSwitchToRegister}
          >
            Don&apos;t have an account? Create account
          </button>
        </form>
      </div>
    </div>
  );
}
