import React, { useEffect } from 'react';
import DashboardPage from './DashboardPage';
import { useViewRole } from '../context/ViewRoleContext';

export default function HospitalDashboardPage() {
  const { viewRole, setViewRole } = useViewRole();

  useEffect(() => {
    if (viewRole !== 'hospital') {
      setViewRole('hospital');
    }
  }, [viewRole, setViewRole]);

  return <DashboardPage />;
}
