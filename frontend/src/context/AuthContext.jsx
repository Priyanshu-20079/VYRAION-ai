import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_API_URL } from '../config/api';

const AuthContext = createContext();

const API_BASE_URL = AUTH_API_URL;
const TOKEN_KEY = 'vyraion_auth_token';
const USER_KEY = 'vyraion_user_data';
const DEMO_KEY = 'vyraion_demo_mode';

// ── ROLE POLICY (mirrors backend resolveRole) ─────────────────────────────────
// operator@vyraion.ai → operator   |   everyone else → admin
// Used client-side to detect and flush stale cached tokens.
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

// ── TOKEN VERSION BUST ────────────────────────────────────────────────────────
// Increment this whenever the auth schema changes. Any cached token from a
// previous version is immediately flushed so users re-authenticate fresh.
const AUTH_VERSION = '4';
const AUTH_VERSION_KEY = 'vyraion_auth_version';

const clearAllAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(DEMO_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

// Run version check once immediately (before React state is even initialised)
if (localStorage.getItem(AUTH_VERSION_KEY) !== AUTH_VERSION) {
  clearAllAuthStorage();
  localStorage.setItem(AUTH_VERSION_KEY, AUTH_VERSION);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Stale role guard: if cached user has wrong role for their email, enforce correct role
      const expectedRole = resolveExpectedRole(parsed.email);
      if (parsed.role !== expectedRole) {
        parsed.role = expectedRole;
        localStorage.setItem(USER_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem(DEMO_KEY) === 'true' || (localStorage.getItem(TOKEN_KEY) || '').startsWith('vyraion_local_jwt_');
  });
  const [loading, setLoading] = useState(false);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // Sync user data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  // Sync demo mode to localStorage
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(DEMO_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_KEY);
    }
  }, [isDemoMode]);

  // Automatically restore session from backend on mount if valid JWT exists
  useEffect(() => {
    if (!token) return;

    const restoreSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            // Backend always returns the correctly computed role
            const expectedRole = resolveExpectedRole(data.user.email);
            setUser({ ...data.user, role: expectedRole });
            setIsDemoMode(false);
          }
        } else if (res.status === 401) {
          // Token expired or invalid — clear session
          setToken(null);
          setUser(null);
          setIsDemoMode(false);
          clearAllAuthStorage();
        }
      } catch (e) {
        // Network error / server cold start — preserve cached local session in Demo Mode
        if (token.startsWith('vyraion_local_jwt_')) {
          setIsDemoMode(true);
        }
      }
    };

    restoreSession();
  }, [token]);

  const login = async (email, password, force = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, force })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.sessionActive) {
          return data;
        }
        throw new Error(data.message || 'Invalid email or password.');
      }

      const cleanEmail = email.toLowerCase().trim();
      const expectedRole = resolveExpectedRole(cleanEmail);
      const userWithResolvedRole = { ...data.user, role: expectedRole };

      setToken(data.token);
      setUser(userWithResolvedRole);
      setIsDemoMode(false);
      return { ...data, user: userWithResolvedRole };
    } catch (err) {
      if (err.sessionActive) {
        return err;
      }
      // If backend returned a clear API error message (e.g. Invalid email/password), re-throw it
      if (err.message && !err.message.includes('fetch') && err.name !== 'TypeError') {
        throw err;
      }

      // If backend is sleeping / unreachable ('Failed to fetch'), activate explicit Demo Mode
      console.warn('Backend API unreachable or spinning up. Activating explicit Demo Mode session:', err.message);
      const cleanEmail = email.toLowerCase().trim();
      const role = resolveExpectedRole(cleanEmail);
      const fallbackUser = {
        id: 'usr_local_' + Date.now(),
        name: cleanEmail.split('@')[0] || 'Vyraion Operator',
        email: cleanEmail,
        role: role
      };
      const fallbackToken = 'vyraion_local_jwt_' + Date.now();
      setToken(fallbackToken);
      setUser(fallbackUser);
      setIsDemoMode(true);
      return { success: true, token: fallbackToken, user: fallbackUser, isDemoMode: true };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      const cleanEmail = email.toLowerCase().trim();
      const expectedRole = resolveExpectedRole(cleanEmail);
      const userWithResolvedRole = { ...data.user, role: expectedRole };

      setToken(data.token);
      setUser(userWithResolvedRole);
      setIsDemoMode(false);
      return { ...data, user: userWithResolvedRole };
    } catch (err) {
      // If backend returned an API error (e.g. Email already registered), re-throw it
      if (err.message && !err.message.includes('fetch') && err.name !== 'TypeError') {
        throw err;
      }

      // If backend is sleeping / unreachable ('Failed to fetch'), activate explicit Demo Mode
      console.warn('Backend API unreachable or spinning up. Activating explicit Demo Mode registration:', err.message);
      const cleanEmail = email.toLowerCase().trim();
      const role = resolveExpectedRole(cleanEmail);
      const fallbackUser = {
        id: 'usr_local_' + Date.now(),
        name: name || cleanEmail.split('@')[0] || 'Vyraion User',
        email: cleanEmail,
        role: role
      };
      const fallbackToken = 'vyraion_local_jwt_' + Date.now();
      setToken(fallbackToken);
      setUser(fallbackUser);
      setIsDemoMode(true);
      return { success: true, token: fallbackToken, user: fallbackUser, isDemoMode: true };
    } finally {
      setLoading(false);
    }
  };

  // Clear auth token and user data
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DEMO_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isDemoMode,
    loading,
    login,
    register,
    logout
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
