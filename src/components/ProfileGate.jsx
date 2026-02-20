import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import Layout from './Layout';
import Profile from './Profile';
import styles from './ProfileGate.module.css';

/**
 * Renders Profile when the user is logged in or admin is active.
 * When not logged in and not admin, redirects to sign-in with returnTo.
 */
export default function ProfileGate() {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading…</div>
      </Layout>
    );
  }
  if (user || isAdmin) return <Profile />;
  return <Navigate to="/sign-in" state={{ returnTo: '/profile' }} replace />;
}
