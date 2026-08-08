import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'vyraion_auth_token';
const USER_KEY = 'vyraion_user_data';
const DEMO_KEY = 'vyraion_demo_mode';

const resolveExpectedRole = (email) => {
  if (!email) return 'admin';
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'operator@vyraion.ai' || cleanEmail === 'operator@vyraion.demo') return 'operator';
  if (cleanEmail === 'admin@vyraion.demo') return 'admin';
  if (cleanEmail === 'police@vyraion.demo') return 'authority';
  if (cleanEmail === 'hospital@vyraion.demo') return 'hospital';
  if (cleanEmail === 'investigator@vyraion.demo') return 'investigator';
  if (cleanEmail === 'reviewer@vyraion.demo') return 'reviewer';
  if (cleanEmail === 'user@vyraion.demo') return 'user';
  return 'admin';
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || 'vyraion_demo_token_admin');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: 'usr_demo_admin',
      name: 'System Admin',
      email: 'admin@vyraion.demo',
      role: 'admin'
    };
  });
  const [isDemoMode] = useState(true);
  const [loading] = useState(false);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }, [token]);

  // Sync user data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }, [user]);

  // Always keep demo mode active
  useEffect(() => {
    localStorage.setItem(DEMO_KEY, 'true');
  }, []);

  // Synchronously switch department role in Demo Mode (0ms, no backend fetch)
  const setDemoUserRole = (role) => {
    const targetRole = (role || 'admin').toLowerCase();
    const roleEmails = {
      admin: 'admin@vyraion.demo',
      authority: 'police@vyraion.demo',
      hospital: 'hospital@vyraion.demo',
      operator: 'operator@vyraion.demo'
    };
    const roleNames = {
      admin: 'System Admin',
      authority: 'Police Command',
      hospital: 'Hospital Ops',
      operator: 'Operator Console'
    };
    const updatedUser = {
      id: `usr_demo_${targetRole}`,
      name: roleNames[targetRole] || 'Demo User',
      email: roleEmails[targetRole] || `${targetRole}@vyraion.demo`,
      role: targetRole
    };
    const demoToken = `vyraion_demo_token_${targetRole}`;
    setToken(demoToken);
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(TOKEN_KEY, demoToken);
    localStorage.setItem(DEMO_KEY, 'true');
    return { success: true, user: updatedUser, token: demoToken };
  };

  const login = async (email, password) => {
    if (['admin', 'authority', 'hospital', 'operator'].includes(email)) {
      return setDemoUserRole(email);
    }
    const cleanEmail = (email || 'admin@vyraion.demo').toLowerCase().trim();
    const role = resolveExpectedRole(cleanEmail);
    return setDemoUserRole(role);
  };

  const register = async (name, email) => {
    const cleanEmail = (email || 'user@vyraion.demo').toLowerCase().trim();
    const role = resolveExpectedRole(cleanEmail);
    return setDemoUserRole(role);
  };

  const logout = () => {
    setDemoUserRole('admin');
  };

  const value = {
    token,
    user,
    isAuthenticated: true, // Always true in Demo Mode
    isDemoMode: true,
    loading: false,
    login,
    register,
    logout,
    setDemoUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
