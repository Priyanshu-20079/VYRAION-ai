import React, { useEffect } from 'react';
import PoliceFireDashboardPage from './PoliceFireDashboardPage';
import { useViewRole } from '../context/ViewRoleContext';

export default function AuthorityDashboardPage() {
  const { viewRole, setViewRole } = useViewRole();

  useEffect(() => {
    if (viewRole !== 'authority') {
      setViewRole('authority');
    }
  }, [viewRole, setViewRole]);

  return <PoliceFireDashboardPage />;
}
