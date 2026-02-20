import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { isRunningAsPWA } from '../utils/pwa';
import styles from './SignInPage.module.css';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  const { signIn } = useAuth();
  const [isPWA, setIsPWA] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsPWA(isRunningAsPWA());
  }, []);

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true);

  // Email/password sign-in (PWA-safe; uses AuthContext so state stays in sync)
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      const { data, error: err } = result;
      if (err) {
        setError(err.message || 'Sign in failed');
        return;
      }
      if (data?.user) {
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // OAuth sign-in (browser only; redirects away to provider then back to /auth/callback)
  const handleOAuthSignIn = async (provider) => {
    if (!supabase) {
      setError('Sign-in is not configured');
      return;
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) setError(err.message);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Sign-in is not configured');
      return;
    }
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(err.message);
    } else {
      setError('');
      alert('Check your email for a confirmation link.');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className={styles.page}>
        <BackLink />
        <PageHeader title="Sign in" subtitle="Enter your email and password to continue." />
        {!isPWA && supabase && (
          <div className={styles.oauthRow}>
            <Button
              type="button"
              variant="secondary"
              className={styles.oauthBtn}
              onClick={() => handleOAuthSignIn('google')}
            >
              Sign in with Google
            </Button>
          </div>
        )}
        <form onSubmit={isSignUp ? handleSignUp : handlePasswordSignIn} className={styles.form}>
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
          <Link to="/forgot-password" className={styles.forgot}>
            Forgot password?
          </Link>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading
              ? (isSignUp ? 'Creating account…' : 'Signing in…')
              : isSignUp
                ? 'Create account'
                : isPWA
                  ? 'Sign in'
                  : 'Sign in with email'}
          </Button>
          <p className={styles.register}>
            {isSignUp ? (
              <>Already have an account? <button type="button" className={styles.linkButton} onClick={() => { setIsSignUp(false); setError(''); }}>Sign in</button></>
            ) : (
              <>Don&apos;t have an account? <button type="button" className={styles.linkButton} onClick={() => { setIsSignUp(true); setError(''); }}>Create account</button></>
            )}
          </p>
          <p className={styles.adminLink}>
            <Link to="/admin-login">Admin</Link>
          </p>
          {isStandalone && (
            <p className={styles.openInBrowser}>
              Sign-in not working here?{' '}
              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : ''}/sign-in`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in browser to sign in
              </a>
            </p>
          )}
        </form>
        <section className={styles.goPro} aria-label="Go Pro">
          <span className={styles.goProBadge}>Go Pro</span>
          <h3 className={styles.goProTitle}>Unlock all features — €3/month</h3>
          <p className={styles.goProDesc}>
            Workout plans, full analytics, AI assistant, custom routines & more. Upgrade anytime from Profile.
          </p>
        </section>
      </div>
    </Layout>
  );
}
