import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PaywallOverlay from './PaywallOverlay';
import styles from './ProGate.module.css';

/**
 * Renders children if user is Pro; otherwise renders a blurred preview with PaywallOverlay.
 * When guest taps "Sign up & go Pro", navigates to the registration page (then checkout).
 */
export default function ProGate({ feature, title, description, children }) {
  const navigate = useNavigate();
  const { isPro, loading } = useAuth();

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (isPro) {
    return children;
  }

  const handleSignUpFirst = () => navigate('/register', { state: { afterRegister: 'checkout' } });

  return (
    <div className={styles.wrapper}>
      <div className={styles.preview} aria-hidden="true">
        {children}
      </div>
      <PaywallOverlay
        feature={feature}
        title={title}
        description={description}
        onSignUpFirst={handleSignUpFirst}
      />
    </div>
  );
}
