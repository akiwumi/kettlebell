import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import Profile from './Profile';
import styles from './ProfileGate.module.css';

/**
 * Renders Profile when the user is logged in.
 * When not logged in, redirects to sign-in with returnTo so they come back to profile after login/register.
 */
export default function ProfileGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading…</div>
      </Layout>
    );
  }
  if (user) return <Profile />;
  return <Navigate to="/sign-in" state={{ returnTo: '/profile' }} replace />;
}
