import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

export const AdminRoute = ({ children }) => {
  const { adminToken } = useAuth();
  return adminToken ? children : <Navigate to="/admin/login" replace />;
};
