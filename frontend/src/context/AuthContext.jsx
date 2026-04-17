// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pojjari_user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = (token, userData) => {
    localStorage.setItem('pojjari_token', token);
    localStorage.setItem('pojjari_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pojjari_token');
    localStorage.removeItem('pojjari_user');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin  = user?.role === 'admin';
  const isPujari = user?.role === 'pujari';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, isPujari, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
