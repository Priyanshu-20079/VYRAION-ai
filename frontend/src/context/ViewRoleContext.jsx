import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewRoleContext = createContext();

export function ViewRoleProvider({ children }) {
  const [viewRole, setViewRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vyraion_view_role');
      if (['operator', 'authority', 'hospital', 'investigator', 'reviewer'].includes(stored)) {
        return stored;
      }
    }
    return 'operator';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyraion_view_role', viewRole);
    }
  }, [viewRole]);

  return (
    <ViewRoleContext.Provider value={{ viewRole, setViewRole }}>
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
