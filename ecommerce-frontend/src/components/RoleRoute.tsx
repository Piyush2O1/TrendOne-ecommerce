import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type UserRole = 'user' | 'seller' | 'admin';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: ReactElement;
}

const RoleRoute = ({ allowedRoles, children }: RoleRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
