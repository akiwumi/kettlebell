import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import BackLink from './BackLink';
import PageHeader from './PageHeader';
import Button from './Button';
import { useAdmin } from '../contexts/AdminContext';
import styles from './AdminLoginPage.module.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = adminLogin(email.trim(), password);
    setLoading(false);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <BackLink />
        <PageHeader
          title="Admin login"
          subtitle="Sign in with admin credentials to access all areas of the app."
        />
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Checking…' : 'Sign in as admin'}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
