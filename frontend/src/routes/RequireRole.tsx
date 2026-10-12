import { Outlet, useLocation } from 'react-router';
import { getCurrentUser } from '@/lib/session';
import Forbidden from '@/pages/Forbidden';
import { canAccess, metaOf } from './config';

/** Chặn route theo `roles` trong ROUTE_META. Chỉ là lớp UI — server vẫn phải trả 403. */
const RequireRole = () => {
  const { pathname } = useLocation();
  return canAccess(metaOf(pathname), getCurrentUser().role) ? <Outlet /> : <Forbidden />;
};

export default RequireRole;
