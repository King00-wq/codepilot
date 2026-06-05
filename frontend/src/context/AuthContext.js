import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ach_token');
    const cached = localStorage.getItem('ach_user');
    if (token && cached) {
      try { setUser(JSON.parse(cached)); } catch {}
      authAPI.me()
        .then(r => { setUser(r.data.user); localStorage.setItem('ach_user', JSON.stringify(r.data.user)); })
        .catch(() => { localStorage.removeItem('ach_token'); localStorage.removeItem('ach_user'); setUser(null); })
        .finally(() => { setLoading(false); setInitialized(true); });
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('ach_token', token);
    localStorage.setItem('ach_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('ach_token');
    localStorage.removeItem('ach_user');
    localStorage.removeItem('ach_draft_code');
    setUser(null);
  }, []);

  const updateUser = useCallback(updated => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('ach_user', JSON.stringify(merged));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
