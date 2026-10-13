import { LayoutDashboard, ClipboardList, ShieldCheck, Target, UserRound, Bell, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/lib/session';

export type NavGroup = 'main' | 'admin';

/** Key trong namespace `nav` (src/i18n/locales/en/nav.json). */
export type NavKey = 'dashboard' | 'kpi' | 'evaluations' | 'notifications' | 'profile' | 'roles';

export type RouteMeta = {
  /** Key dịch của tiêu đề trang (namespace `nav`). */
  title: NavKey;
  /** Thanh trên: bộ lọc kỳ Tháng/Quý/Năm và ô tìm kiếm — mặc định ẩn. */
  toolbar?: { period?: boolean; search?: boolean };
  /** Vai trò được phép truy cập; bỏ trống = mọi vai trò. */
  roles?: AppRole[];
  nav?: { icon: LucideIcon; group: NavGroup; badge?: number };
};

/** Một nguồn cho tiêu đề, thanh trên, quyền truy cập và sidebar. Trang mới chỉ cần thêm một dòng. */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': {
    title: 'dashboard',
    toolbar: { period: true, search: true },
    nav: { icon: LayoutDashboard, group: 'main' },
  },
  '/kpi': {
    title: 'kpi',
    toolbar: { period: true, search: true },
    nav: { icon: Target, group: 'main' },
  },
  '/evaluations': { title: 'evaluations', nav: { icon: ClipboardList, group: 'main' } },
  '/notifications': { title: 'notifications', nav: { icon: Bell, group: 'main', badge: 3 } },
  '/profile': { title: 'profile', nav: { icon: UserRound, group: 'main' } },
  '/roles': {
    title: 'roles',
    roles: ['AD'],
    nav: { icon: ShieldCheck, group: 'admin' },
  },
};

/** Key dịch của nhãn nhóm (namespace `nav`, mục `groups`); `null` = không có nhãn. */
export const NAV_GROUP_LABEL: Record<NavGroup, 'admin' | null> = { main: null, admin: 'admin' };

export const canAccess = (meta: RouteMeta | undefined, role: AppRole) => !meta?.roles || meta.roles.includes(role);

export const metaOf = (pathname: string): RouteMeta | undefined =>
  ROUTE_META[pathname.replace(/\/+$/, '') || '/'];
