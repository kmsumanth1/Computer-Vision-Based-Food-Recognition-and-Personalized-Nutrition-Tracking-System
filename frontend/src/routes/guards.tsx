import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  from?: { pathname?: string };
}

/** Login, Signup and Forgot Password. Signed-in users are sent on to the app. */
export function PublicOnly() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading variant="screen" message="Loading…" />;
  if (status === 'authenticated' && user) {
    const from = (location.state as LocationState | null)?.from?.pathname;
    return <Navigate to={user.profile_completed ? (from ?? '/dashboard') : '/setup'} replace />;
  }
  return <Outlet />;
}

/** Any signed-in page. Unauthenticated users go to Login. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading variant="screen" message="Loading…" />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Main app pages. Users who haven't finished profile setup go to Profile Setup first. */
export function RequireProfile() {
  const { user } = useAuth();
  if (user && !user.profile_completed) return <Navigate to="/setup" replace />;
  return <Outlet />;
}
