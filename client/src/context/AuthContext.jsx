import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('srmUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('studentToken') || null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(false);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('srmUser', JSON.stringify(userData));
    localStorage.setItem('studentToken', userToken);
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('srmUser', JSON.stringify(newUserData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('srmUser');
    localStorage.removeItem('studentToken');
  };

  const adminLogin = (adminToken) => {
    setAdminToken(adminToken);
    localStorage.setItem('adminToken', adminToken);
  };

  const adminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, adminToken, loading, login, logout, adminLogin, adminLogout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
