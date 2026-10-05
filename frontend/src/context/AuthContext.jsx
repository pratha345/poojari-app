// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pojjari_user')); }
    catch { return null; }
  });

  // The API layer clears an expired token and fires this event; reflect it in state so
  // the header shows "login" and protected routes redirect, without a hard page reload.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('pojjari_token', token);
    localStorage.setItem('pojjari_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pojjari_token');
    localStorage.removeItem('pojjari_user');
    localStorage.removeItem('pojjari_theme');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isSuperAdmin    = user?.role === 'super_admin';
  const isAdmin         = user?.role === 'admin' || isSuperAdmin;
  const isPujari        = user?.role === 'pujari';
  const isAbhyasak      = user?.role === 'abhyasak';

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isAuthenticated, isSuperAdmin, isAdmin, isPujari, isAbhyasak,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
