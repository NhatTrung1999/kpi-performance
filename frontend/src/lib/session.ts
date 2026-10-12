import { getToken, TOKEN_KEY, USER_KEY } from './axios';

/** AD = Admin, CQ = Chủ quản, NV = Nhân viên. */
export type AppRole = 'AD' | 'CQ' | 'NV';

export const ROLE_PORTAL: Record<AppRole, string> = {
  AD: 'Cổng quản trị',
  CQ: 'Cổng chủ quản',
  NV: 'Cổng nhân viên',
};

export type CurrentUser = { name: string; title: string; role: AppRole; roleKnown: boolean };

const ROLE_ALIASES: Record<string, AppRole> = {
  AD: 'AD', ADMIN: 'AD',
  CQ: 'CQ', MANAGER: 'CQ',
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

const readStored = (): Record<string, unknown> => {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getCurrentUser = (): CurrentUser => {
  const token = getToken();
  const claims = token ? decodePayload(token) : {};
  const stored = readStored();
  const role = roleOf(stored.role) ?? roleOf(claims.role);
  return {
    name: str(stored.name) || str(claims.name) || 'Người dùng',
    title: str(stored.title) || str(claims.title),
    role: role ?? 'NV',
    roleKnown: !!role,
  };
};

/** Lưu user vào cùng nơi với token (localStorage nếu "ghi nhớ", ngược lại sessionStorage). */
export const saveCurrentUser = (user: unknown) => {
  if (!user || typeof user !== 'object') return;
  const target = localStorage.getItem(TOKEN_KEY) !== null ? localStorage : sessionStorage;
  try {
    target.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage đầy/bị chặn: dùng claim trong token */
  }
};

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();
