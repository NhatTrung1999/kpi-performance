import { Navigate } from 'react-router';
import { useCurrentUser } from '@/lib/session';
import { homeOf } from './config';

/** `/` → trang chủ theo vai trò (HR, KT không vào được Đề xuất KPI). */
const HomeRedirect = () => <Navigate to={homeOf(useCurrentUser().role)} replace />;

export default HomeRedirect;
