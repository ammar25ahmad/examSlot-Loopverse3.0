import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FullPageLoader } from '../ui/States.jsx';

export function homeFor(role, user) {
  if (role === 'admin') return '/admin';
  if (role === 'student') return user?.hasSelectedBranch ? '/student' : '/student/select-branch';
  return '/login';
}

export function RequireRole({ role, children }) {
  const { user, role: currentRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && currentRole !== role) {
    return <Navigate to={homeFor(currentRole, user)} replace />;
  }
  return children ?? <Outlet />;
}

export function RequireBranchSelected() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user && !user.hasSelectedBranch) return <Navigate to="/student/select-branch" replace />;
  return <Outlet />;
}

export function RedirectIfAuthed({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={homeFor(role, user)} replace />;
  return children;
}

export default RequireRole;
