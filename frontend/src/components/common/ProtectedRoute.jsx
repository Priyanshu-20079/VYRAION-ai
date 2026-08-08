import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // In DEMO MODE, routes are directly accessible without login blocking
  return children ? children : <Outlet />;
}
