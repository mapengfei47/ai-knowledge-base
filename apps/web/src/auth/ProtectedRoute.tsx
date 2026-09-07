import { Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { token, user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <div className="route-loader"><Spin size="large" /></div>;
  if (!token || !user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

