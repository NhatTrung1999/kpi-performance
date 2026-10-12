import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/auth/Login';
import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import ProtectedRoute from './ProtectedRoute';
import RequireRole from './RequireRole';
import Dashboard from '@/pages/dashboard';
import NotFound from '@/pages/NotFound';
import Roles from '@/pages/roles';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: 'login', element: <Login /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to="dashboard" replace />,
          },
          { path: 'dashboard', element: <Dashboard /> },
          {
            element: <RequireRole />,
            children: [{ path: 'roles', element: <Roles /> }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
