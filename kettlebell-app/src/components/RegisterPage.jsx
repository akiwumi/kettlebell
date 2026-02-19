import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../lib/stripeClient';
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
  const { signUp } = useAuth();
  const goToCheckoutAfter = location.state?.afterRegister === 'checkout';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    const userEmail = data?.user?.email || email.trim();
    if (goToCheckoutAfter && userEmail) {
      createCheckoutSession(userEmail).catch(() => setError('Could not start checkout.'));
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <Layout>
      <div className={styles.page}>
        <BackLink />
        <PageHeader
          title="Create account"
          subtitle={goToCheckoutAfter ? 'Sign up, then you’ll go to payment for Pro access.' : 'Sign up to save progress and unlock Pro features.'}
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
            Already have an account? <Link to="/sign-in">Sign in</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
