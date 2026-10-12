import { LayoutDashboard, ClipboardList, ShieldCheck, Target, UserRound, Bell, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/lib/session';

export type NavGroup = 'main' | 'admin';

export type RouteMeta = {
  title: string;
  /** Thanh trên: bộ lọc kỳ Tháng/Quý/Năm và ô tìm kiếm — mặc định ẩn. */
  toolbar?: { period?: boolean; search?: boolean };
  /** Vai trò được phép truy cập; bỏ trống = mọi vai trò. */
  roles?: AppRole[];
  nav?: { label: string; icon: LucideIcon; group: NavGroup; badge?: number };
};

/** Một nguồn cho tiêu đề, thanh trên, quyền truy cập và sidebar. Trang mới chỉ cần thêm một dòng. */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': {
    title: 'Tổng quan',
    toolbar: { period: true, search: true },
    nav: { label: 'Tổng quan', icon: LayoutDashboard, group: 'main' },
  },
  '/kpi': {
    title: 'KPI của tôi',
    toolbar: { period: true, search: true },
    nav: { label: 'KPI của tôi', icon: Target, group: 'main' },
  },
  '/evaluations': { title: 'Đánh giá', nav: { label: 'Đánh giá', icon: ClipboardList, group: 'main' } },
  '/notifications': { title: 'Thông báo', nav: { label: 'Thông báo', icon: Bell, group: 'main', badge: 3 } },
  '/profile': { title: 'Hồ sơ và cài đặt', nav: { label: 'Hồ sơ và cài đặt', icon: UserRound, group: 'main' } },
  '/roles': {
    title: 'Phân quyền',
    roles: ['AD'],
    nav: { label: 'Phân quyền', icon: ShieldCheck, group: 'admin' },
  },
};

export const NAV_GROUP_LABEL: Record<NavGroup, string | null> = { main: null, admin: 'QUẢN TRỊ' };

export const canAccess = (meta: RouteMeta | undefined, role: AppRole) => !meta?.roles || meta.roles.includes(role);

export const metaOf = (pathname: string): RouteMeta | undefined =>
  ROUTE_META[pathname.replace(/\/+$/, '') || '/'];
