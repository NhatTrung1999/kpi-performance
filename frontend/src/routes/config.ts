import { CalendarRange, FileText, History, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/lib/session';

export type NavGroup = 'proposal' | 'admin';

/** Key trong namespace `nav` (src/i18n/locales/<lng>/nav.json). */
export type NavKey = 'periods' | 'proposals' | 'history' | 'roles';

export type RouteMeta = {
  /** Key dịch của tiêu đề trang (namespace `nav`). */
  title: NavKey;
  /** Vai trò được phép truy cập; bỏ trống = mọi vai trò. */
  roles?: AppRole[];
  nav?: { icon: LucideIcon; group: NavGroup; badge?: number };
};

/**
 * Một nguồn cho tiêu đề, quyền truy cập và sidebar. Trang mới chỉ cần thêm một dòng.
 * Hệ thống chỉ dành cho Chủ quản (CQ), Ban lãnh đạo (BLD) và Admin (AD) — không có trang cho nhân viên.
 * Chỉ Admin có sidebar (xem SIDEBAR_ROLES); CQ và BLD chỉ có trang Đề xuất KPI.
 */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/periods': { title: 'periods', roles: ['AD'], nav: { icon: CalendarRange, group: 'proposal' } },
  // CQ: lập đề xuất cho các bộ phận được gán; BLD: tạm thời chỉ xem; AD: xem/sửa mọi bộ phận.
  '/proposals': { title: 'proposals', roles: ['AD', 'CQ', 'BLD'], nav: { icon: FileText, group: 'proposal' } },
  '/history': { title: 'history', roles: ['AD'], nav: { icon: History, group: 'proposal' } },
  '/roles': { title: 'roles', roles: ['AD'], nav: { icon: ShieldCheck, group: 'admin' } },
};

/** Trang chủ sau đăng nhập (mọi vai trò được vào). */
export const HOME_PATH = '/proposals';

/** Vai trò có sidebar; vai trò khác chỉ có thanh trên. */
export const SIDEBAR_ROLES: AppRole[] = ['AD'];

/** Key dịch của nhãn nhóm (namespace `nav`, mục `groups`); `null` = không có nhãn. */
export const NAV_GROUP_LABEL: Record<NavGroup, 'proposal' | 'admin' | null> = { proposal: 'proposal', admin: 'admin' };

/**
 * Phân quyền theo vai trò trên giao diện (backend trả `role` ở /auth/login, /auth/me và trong JWT).
 * Chỉ để điều hướng/hiển thị — backend tự chặn (RolesGuard, lọc dữ liệu theo phạm vi).
 */
export const ROLE_GATING = true;

export const canAccess = (meta: RouteMeta | undefined, role: AppRole) =>
  !ROLE_GATING || !meta?.roles || meta.roles.includes(role);

export const metaOf = (pathname: string): RouteMeta | undefined =>
  ROUTE_META[pathname.replace(/\/+$/, '') || '/'];
