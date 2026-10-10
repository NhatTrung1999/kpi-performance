import { Navigate, Outlet } from 'react-router';
import { getToken } from '@/lib/axios';

const ProtectedRoute = () => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
