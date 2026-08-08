import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewRoleContext = createContext();

export function ViewRoleProvider({ children }) {
  const [viewRole, setViewRole] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('vyraion_user_data');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.role && user.role !== 'admin') {
            return user.role;
          }
        }
      } catch (e) {}
      
      const stored = localStorage.getItem('vyraion_view_role');
      if (['operator', 'authority', 'hospital', 'investigator', 'reviewer', 'admin', 'user'].includes(stored)) {
        return stored;
      }
    }
    return 'authority';
  });

  const [incidentCounts, setIncidentCounts] = useState({ visible: 0, total: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyraion_view_role', viewRole);
    }
  }, [viewRole]);

  return (
    <ViewRoleContext.Provider value={{ viewRole, setViewRole, incidentCounts, setIncidentCounts }}>
      {children}
    </ViewRoleContext.Provider>
  );
}

export function useViewRole() {
  const context = useContext(ViewRoleContext);
  if (!context) {
    throw new Error('useViewRole must be used within a ViewRoleProvider');
  }
  return context;
}
