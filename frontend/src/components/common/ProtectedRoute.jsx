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
    if (reqAllowedRole === 'operator' && userRole === 'admin') {
      // Admin trying to access operator console -> redirect to Operator Login
      return <Navigate to="/operator/login" replace />;
    }

    if (reqAllowedRole === 'admin' && userRole === 'operator') {
      // Operator trying to access dashboard -> show Access Denied page
      return (
        <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6 text-white font-mono">
          <div className="glass-panel p-8 max-w-md w-full border border-red-500/30 rounded-3xl text-center space-y-6 bg-gradient-to-b from-slate-950 via-[#111827] to-slate-950 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-red-500 uppercase tracking-widest">Access Denied</h1>
              <p className="text-xs text-slate-400">
                Access Denied - Administrator privileges required.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-xs text-slate-300 text-left space-y-1">
              <p>👤 Current User: <strong className="text-white">{user.name}</strong></p>
              <p>🔑 Current Role: <strong className="text-amber-400 font-bold uppercase">{user.role}</strong></p>
            </div>

            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out & Switch Account</span>
            </button>
          </div>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
}
