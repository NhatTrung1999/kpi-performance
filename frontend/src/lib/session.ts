import { useMemo } from 'react';
import i18n from '@/i18n';
import { useAuthStore, type ServerUser } from '@/stores/auth';

/**
 * AD = Admin, CQ = Chủ quản, BLD = Ban lãnh đạo (duyệt đề xuất), NV = Nhân viên.
 * Hệ thống không dành cho nhân viên: NV chỉ là giá trị dự phòng khi không xác định được vai trò (server trả 403 khi đăng nhập).
 */
export type AppRole = 'AD' | 'CQ' | 'BLD' | 'NV';

/** Tên cổng theo vai trò, theo ngôn ngữ hiện tại. */
export const portalOf = (role: AppRole) => i18n.t(`portal.${role}`);

export type CurrentUser = { name: string; title: string; email: string; role: AppRole; roleKnown: boolean };

const ROLE_ALIASES: Record<string, AppRole> = {
  AD: 'AD', ADMIN: 'AD',
  CQ: 'CQ', MANAGER: 'CQ',
  BLD: 'BLD', BOARD: 'BLD', DIRECTOR: 'BLD',
  NV: 'NV', EMPLOYEE: 'NV', STAFF: 'NV',
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const roleOf = (v: unknown): AppRole | undefined => ROLE_ALIASES[str(v).toUpperCase()];

/**
 * Nguồn người dùng, theo thứ tự ưu tiên:
 *   1. user do server trả về khi đăng nhập hoặc từ GET /auth/me (lưu cùng nơi với token);
 *   2. claim `role`, `name`, `title` trong JWT (dự phòng).
 * Chỉ để điều hướng/hiển thị — client không phải lớp bảo mật; server phải tự kiểm tra quyền (403).
 * Không xác định được vai trò thì dùng quyền thấp nhất (Nhân viên) và đặt roleKnown = false để UI báo rõ.
 */
const decodePayload = (token: string): Record<string, unknown> => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(part), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return {};
  }
};

const deriveUser = (token: string | null, stored: ServerUser | null): CurrentUser => {
  const claims = token ? decodePayload(token) : {};
  const user = stored ?? {};
  const role = roleOf(user.role) ?? roleOf(claims.role);
  return {
    name: str(user.name) || str(claims.name) || i18n.t('user'),
    title: str(user.title) || str(claims.title),
    email: str(user.email) || str(claims.email),
    role: role ?? 'NV',
    roleKnown: !!role,
  };
};

/** User hiện tại cho code ngoài React (đọc một lần, không theo dõi thay đổi). */
export const getCurrentUser = (): CurrentUser => {
  const { token, user } = useAuthStore.getState();
  return deriveUser(token, user);
};

/** User hiện tại trong component: tự re-render khi đăng nhập/đăng xuất, refresh token hoặc /auth/me trả tên mới. */
export const useCurrentUser = (): CurrentUser => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useMemo(() => deriveUser(token, user), [token, user]);
};

/** Lưu user do server trả về (cùng nơi với token: localStorage nếu "ghi nhớ", ngược lại sessionStorage). */
export const saveCurrentUser = (user: unknown) => useAuthStore.getState().setUser(user);

/** Tên gọi trong lời chào: bỏ họ khi tên có từ ba chữ trở lên ("Nguyễn Minh Anh" → "Minh Anh"). */
export const shortNameOf = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length >= 3 ? words.slice(1).join(' ') : name;
};

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();
