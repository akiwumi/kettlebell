import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Profile from './Profile';

/**
 * Renders Profile when the user is logged in.
 * When not logged in, redirects to sign-in with returnTo so they come back to profile after login/register.
 */
export default function ProfileGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Profile />;
  return <Navigate to="/sign-in" state={{ returnTo: '/profile' }} replace />;
}
