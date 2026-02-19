import { useState } from 'react';
import Button from '../Button';
import styles from './EmailVerification.module.css';

export default function EmailVerification({ email, onResend, onChangeEmail }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    await onResend?.();
    setSent(true);
    setLoading(false);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.text}>
          We sent a verification link to <strong>{email}</strong>. Click the link
          in that email to verify your account and continue.
        </p>
        <p className={styles.hint}>
          Didn’t receive it? Check spam or click below to resend.
        </p>
        <Button
          onClick={handleResend}
          disabled={loading}
          className={styles.btn}
        >
          {loading ? 'Sending…' : 'Resend email'}
        </Button>
        {sent && (
          <p className={styles.sent} role="status">
            Verification email sent again.
          </p>
        )}
        {onChangeEmail && (
          <button type="button" className={styles.changeEmail} onClick={onChangeEmail}>
            Use a different email
          </button>
        )}
      </div>
    </div>
  );
}
