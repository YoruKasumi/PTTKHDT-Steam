import { Navigate, useLocation } from 'react-router-dom';
import { getRoleLandingPath } from '../utils/roleLanding';

function getStoredUser() {
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export default function RouteGuard({ allowedRoles, allowedPermissions = [], children }) {
  const location = useLocation();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

  const user = getStoredUser();
  const roles = user?.roles || [];
  if (!allowedRoles.some((role) => roles.includes(role))) {
    return <Navigate to={getRoleLandingPath(user)} replace state={{ accessDenied: true }} />;
  }
  if (allowedPermissions.length && !roles.includes('Admin')
    && !allowedPermissions.some((permission) => (user?.permissions || []).includes(permission))) {
    return <Navigate to={getRoleLandingPath(user)} replace state={{ accessDenied: true }} />;
  }
  return children;
}
