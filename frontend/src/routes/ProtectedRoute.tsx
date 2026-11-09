import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth';

const ProtectedRoute = () => {
  // Theo dõi store: đăng xuất (kể cả ở tab khác) là quay về /login ngay.
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
