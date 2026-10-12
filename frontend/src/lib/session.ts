import { getToken } from './axios';

/** AD = Admin, CQ = Chủ quản, NV = Nhân viên. */
export type AppRole = 'AD' | 'CQ' | 'NV';

export const ROLE_PORTAL: Record<AppRole, string> = {
  AD: 'Cổng quản trị',
  CQ: 'Cổng chủ quản',
  NV: 'Cổng nhân viên',
};

export type CurrentUser = { name: string; title: string; role: AppRole };

const ROLE_ALIASES: Record<string, AppRole> = {
  AD: 'AD', ADMIN: 'AD',
  CQ: 'CQ', MANAGER: 'CQ',
  NV: 'NV', EMPLOYEE: 'NV', STAFF: 'NV',
};

/**
 * Giả định hợp đồng (cần đối chiếu với backend): JWT mang claim `role`, `name`, `title`.
 * Chỉ để điều hướng/hiển thị — client không phải lớp bảo mật; server phải tự kiểm tra quyền (403).
 * Không đọc được vai trò thì coi là Nhân viên (quyền thấp nhất).
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

export const getCurrentUser = (): CurrentUser => {
  const token = getToken();
  const p = token ? decodePayload(token) : {};
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    name: str(p.name) || 'Người dùng',
    title: str(p.title),
    role: ROLE_ALIASES[str(p.role).toUpperCase()] ?? 'NV',
  };
};

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();
