import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/auth/Login';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import ProtectedRoute from './ProtectedRoute';
import RequireRole from './RequireRole';
import HomeRedirect from './HomeRedirect';
import NotFound from '@/pages/NotFound';
import Proposals from '@/pages/proposals';
import Promotions from '@/pages/promotions';
import Roles from '@/pages/roles';
import UnderConstruction from '@/pages/UnderConstruction';

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
            element: <HomeRedirect />,
          },
          {
            // Mọi trang đều giới hạn vai trò theo ROUTE_META.
            element: <RequireRole />,
            children: [
              { path: 'proposals', element: <Proposals /> },
              { path: 'promotions', element: <Promotions /> },
              { path: 'periods', element: <UnderConstruction /> },
              { path: 'history', element: <UnderConstruction /> },
              { path: 'roles', element: <Roles /> },
            ],
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
