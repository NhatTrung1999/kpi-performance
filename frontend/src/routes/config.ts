import { FileText, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react';
import type { AppRole } from '@/lib/session';

export type NavGroup = 'proposal' | 'admin';

/** Key trong namespace `nav` (src/i18n/locales/<lng>/nav.json). */
export type NavKey = 'proposals' | 'promotions' | 'roles';

export type RouteMeta = {
  /** Key dịch của tiêu đề trang (namespace `nav`). */
  title: NavKey;
  /** Vai trò được phép truy cập; bỏ trống = mọi vai trò. */
  roles?: AppRole[];
  nav?: { icon: LucideIcon; group: NavGroup; badge?: number };
  /**
   * Pill kỳ trên thanh trên: mặc định quý hiện tại; `false` = ẩn (trang không gắn với kỳ, vd. Phân quyền);
   * `'page'` = trang tự đặt nhãn kỳ của mình qua `usePagePeriodStore` (vd. "Đợt 10/2026" của Thăng chức & lương).
   */
  period?: false | 'page';
};

/**
 * Một nguồn cho tiêu đề, quyền truy cập và sidebar. Trang mới chỉ cần thêm một dòng.
 * Hệ thống dành cho Admin (AD), Chủ quản (CQ), Ban lãnh đạo (BLD), Nhân sự (HR) và Kế toán (KT) — không có trang cho nhân viên.
 * AD, CQ, BLD có sidebar (xem SIDEBAR_ROLES); HR và KT chỉ có trang Thăng chức & lương.
 */
export const ROUTE_META: Record<string, RouteMeta> = {
  // CQ: lập đề xuất cho các bộ phận được gán; BLD: tạm thời chỉ xem; AD: xem/sửa mọi bộ phận.
  '/proposals': { title: 'proposals', roles: ['AD', 'CQ', 'BLD'], nav: { icon: FileText, group: 'proposal' } },
  // Quyền xem/sửa theo nhóm cột: config/promotion-proposal.ts.
  '/promotions': { title: 'promotions', roles: ['AD', 'CQ', 'BLD', 'HR', 'KT'], nav: { icon: TrendingUp, group: 'proposal' }, period: 'page' },
  '/roles': { title: 'roles', roles: ['AD'], nav: { icon: ShieldCheck, group: 'admin' }, period: false },
};

/** Trang chủ mặc định sau đăng nhập. */
export const HOME_PATH = '/proposals';

/** Vai trò có sidebar (có từ hai trang trở lên); vai trò khác chỉ có thanh trên. */
export const SIDEBAR_ROLES: AppRole[] = ['AD', 'CQ', 'BLD'];

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

/** Trang chủ theo vai trò: HOME_PATH nếu được vào, ngược lại trang đầu tiên vai trò được vào (HR, KT → /promotions). */
export const homeOf = (role: AppRole) =>
  canAccess(ROUTE_META[HOME_PATH], role) ? HOME_PATH : (Object.keys(ROUTE_META).find((p) => canAccess(ROUTE_META[p], role)) ?? HOME_PATH);
