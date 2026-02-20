import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import styles from './RegisterPage.module.css';

const MAX_PHOTO_BYTES = 350000;
const MAX_PHOTO_DIM = 400;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > MAX_PHOTO_DIM || height > MAX_PHOTO_DIM) {
        if (width > height) {
          height = Math.round((height / width) * MAX_PHOTO_DIM);
          width = MAX_PHOTO_DIM;
        } else {
          width = Math.round((width / height) * MAX_PHOTO_DIM);
          height = MAX_PHOTO_DIM;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL('image/jpeg', 0.85);
      if (result.length > MAX_PHOTO_BYTES) result = canvas.toDataURL('image/jpeg', 0.7);
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  const { signUp } = useAuth();
  // After registration we go to returnTo or Home; Pro upgrade is opt-in from Profile.

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePhotoChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      let dataUrl = await fileToDataUrl(f);
      if (dataUrl.length > MAX_PHOTO_BYTES) dataUrl = await compressDataUrl(dataUrl);
      setPhotoUrl(dataUrl);
    } catch (_) {
      setPhotoUrl(URL.createObjectURL(f));
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { data, error: err } = await signUp(email.trim(), password, {
      full_name: fullName.trim(),
      avatar_url: photoUrl || undefined,
    });
    setLoading(false);
    if (err) {
      setError(err.message || 'Registration failed');
      return;
    }
    if (data?.user && !data.user.identities?.length) {
      setError('An account with this email already exists. Sign in instead.');
      return;
    }
    // Email confirmation required: Supabase returns user but no session
    if (data?.user && !data.session) {
      setEmailSent(true);
      return;
    }
    navigate(returnTo, { replace: true });
  };

  if (emailSent) {
    return (
      <Layout>
        <div className={styles.page}>
          <BackLink />
          <PageHeader title="Check your email" />
          <div className={styles.emailSent} role="status">
            <p className={styles.emailSentText}>
              We’ve sent a confirmation link to <strong>{email}</strong>. Please check your inbox and click the link to confirm your registration.
            </p>
            <p className={styles.emailSentHint}>
              You can close this page and sign in once you’ve confirmed.
            </p>
          </div>
          <Link to="/sign-in" className={styles.emailSentLink}>Go to sign in</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <BackLink />
        <PageHeader
          title="Create account"
          subtitle="Sign up to save progress. You can upgrade to Pro anytime from Profile."
        />
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.photoWrap}>
            <div className={styles.photoPlaceholder}>
              {photoUrl ? (
                <img src={photoUrl} alt="" className={styles.photoImg} />
              ) : (
                <span className={styles.photoText}>Photo (optional)</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className={styles.photoInput}
              aria-label="Profile photo"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-password">Password (min 8 characters)</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
          <p className={styles.signIn}>
            Already have an account? <Link to="/sign-in" state={location.state}>Sign in</Link>
          </p>
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
