import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RegisterModal from './RegisterModal';
import SignInModal from './SignInModal';
import ForgotPassword from './ForgotPassword';
import styles from './AuthGate.module.css';

/**
 * When the user tries to perform an action that requires an account (e.g. "Start" a routine),
 * show registration modal if not logged in, otherwise render children.
 */
export default function AuthGate({ children, onRequireAuth }) {
  const { user, loading, signUp, signIn, resetPassword } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const openRegister = () => {
    setShowSignIn(false);
    setShowForgot(false);
    setShowRegister(true);
  };
  const openSignIn = () => {
    setShowRegister(false);
    setShowForgot(false);
    setShowSignIn(true);
  };

  const handleRequireAuth = () => {
    if (user) return;
    onRequireAuth?.();
    setShowRegister(true);
  };

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  return (
    <>
      {typeof children === 'function'
        ? children({ openRegister, openSignIn, isLoggedIn: !!user })
        : children}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => setShowRegister(false)}
          onSwitchToSignIn={openSignIn}
          signUp={signUp}
        />
      )}
      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSuccess={() => setShowSignIn(false)}
          onSwitchToRegister={openRegister}
          onForgotPassword={() => { setShowSignIn(false); setShowForgot(true); }}
          signIn={signIn}
        />
      )}
      {showForgot && (
        <ForgotPassword
          onClose={() => setShowForgot(false)}
          onBack={() => { setShowForgot(false); setShowSignIn(true); }}
          resetPassword={resetPassword}
        />
      )}
    </>
  );
}

/** Hook-friendly: call this to get a function that opens the register modal when user is not logged in. */
export function useAuthGate() {
  const { user } = useAuth();
  return { isLoggedIn: !!user, requireAuth: () => {} };
}
