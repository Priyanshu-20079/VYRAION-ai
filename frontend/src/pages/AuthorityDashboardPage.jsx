import React, { useEffect } from 'react';
import DashboardPage from './DashboardPage';
import { useViewRole } from '../context/ViewRoleContext';

export default function AuthorityDashboardPage() {
  const { viewRole, setViewRole } = useViewRole();

  useEffect(() => {
    if (viewRole !== 'authority') {
      setViewRole('authority');
    }
  }, [viewRole, setViewRole]);

  return <DashboardPage />;
}
