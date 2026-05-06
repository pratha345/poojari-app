// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pojjari_user')); }
    catch { return null; }
  });

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

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isAuthenticated, isSuperAdmin, isAdmin, isPujari,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
