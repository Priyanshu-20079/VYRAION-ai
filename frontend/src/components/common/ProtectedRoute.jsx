import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function ProtectedRoute({ allowedRole, children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/operator')) {
      return <Navigate to="/operator/login" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  const userRole = (user?.role || '').toLowerCase();
  const reqAllowedRole = (allowedRole || '').toLowerCase();

  if (reqAllowedRole && user && userRole !== reqAllowedRole) {
    if (userRole === 'operator') return <Navigate to="/operator" replace />;
    if (userRole === 'admin') return <Navigate to="/dashboard" replace />;
    if (userRole === 'hospital') return <Navigate to="/hospital" replace />;
    if (userRole === 'authority') return <Navigate to="/authority" replace />;
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}
