import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('srmUser') || localStorage.getItem('srmUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('studentToken') || localStorage.getItem('studentToken') || null);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(false);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    sessionStorage.setItem('srmUser', JSON.stringify(userData));
    sessionStorage.setItem('studentToken', userToken);
    localStorage.removeItem('srmUser');
    localStorage.removeItem('studentToken');
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    sessionStorage.setItem('srmUser', JSON.stringify(newUserData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('srmUser');
    sessionStorage.removeItem('studentToken');
    localStorage.removeItem('srmUser');
    localStorage.removeItem('studentToken');
  };

  const adminLogin = (adminToken) => {
    setAdminToken(adminToken);
    sessionStorage.setItem('adminToken', adminToken);
    localStorage.removeItem('adminToken');
  };

  const adminLogout = () => {
    setAdminToken(null);
    sessionStorage.removeItem('adminToken');
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
