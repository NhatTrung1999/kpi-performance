export type Unit = { id: string; n: string; c?: number; k?: Unit[] };
/** CQ = chủ quản (được vào hệ thống, thấy nhân viên trong phạm vi); NONE = không được vào. Admin cấu hình ở backend (.env). */
export type Role = 'CQ' | 'NONE';
/** Nhân viên lấy từ API (GET /api/employees, HRIS 0.117) qua useEmployees() — xem use-employees.ts. */
export type Person = {
  /** Person_Serial_Key — khoá cho vai trò/phạm vi (khớp tài khoản đăng nhập). */
  psk: string;
  /** Mã nhân viên (Person_ID). */
  id: string;
  name: string;
  /** Tên tiếng Trung (dòng phụ dưới họ tên); API chưa trả nên hiện để trống. */
  zh?: string;
  /** Department_Serial_Key của đơn vị gốc. */
  deptKey: string;
  /** Mã ngắn của đơn vị (Department_ID), hiện ở cột "Unit". */
  unit: string;
  /** Mã team; null = chưa có team. */
  teamKey: string | null;
  /** Tên team, hiện ở cột "Department". */
  dept: string;
  /** Ngày vào công ty, ISO `YYYY-MM-DD`; hiển thị qua `formatDate`. */
  join: string | null;
  position: string;
};

// Danh sách đơn vị lấy từ API (GET /api/departments, HRIS 0.117) qua useUnits() — xem use-units.ts.
// Tên đơn vị có thể ở dạng "Tên-中文"; giao diện chỉ hiển thị phần trước dấu "-" (xem `unitLabel`).

// Vai trò/phạm vi đã lưu lấy từ API phân quyền (GET/PUT /api/permissions/managers) — xem use-permissions.ts.

/** Thứ tự vai trò trong menu chọn / bộ lọc; nhãn và mô tả lấy từ i18n (namespace `roles`). */
export const ROLE_OPTION_KEYS = ['CQ', 'NONE'] as const;
export const ROLE_FILTER_KEYS = ['all', 'CQ', 'NONE'] as const;
export type RoleFilter = (typeof ROLE_FILTER_KEYS)[number];

/** Tên đơn vị hiển thị: bỏ phần chữ Hán sau dấu "-". */
export const unitLabel = (n: string) => {
  const d = n.indexOf('-');
  return d > 0 && /[一-鿿]/.test(n.slice(d)) ? n.slice(0, d) : n;
};

/** Phần chữ Hán sau dấu "-" của tên đơn vị (dòng phụ dưới tên); không có thì chuỗi rỗng. */
export const unitZh = (n: string) => {
  const d = n.indexOf('-');
  return d > 0 && /[一-鿿]/.test(n.slice(d)) ? n.slice(d + 1).trim() : '';
};

export const norm = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const leavesOf = (u: Unit): Unit[] => (u.k ? u.k.flatMap(leavesOf) : [u]);
export const leafMapOf = (units: Unit[]): Record<string, Unit> =>
  Object.fromEntries(units.flatMap(leavesOf).map((l) => [l.id, l]));
export const countOf = (u: Unit) => leavesOf(u).reduce((a, l) => a + (l.c ?? 0), 0);
export const findUnit = (units: Unit[], id: string) =>
  units.find((u) => u.id === id) ?? units.flatMap((u) => u.k ?? []).find((u) => u.id === id);

/** Mã giả cho nhóm "chưa có team" của một đơn vị (backend trả id = null). */
export const noTeamId = (deptId: string) => `${deptId}::no-team`;

/** Nhân viên thuộc đơn vị/team đang chọn; không chọn = tất cả. */
export const peopleInUnit = (all: Person[], units: Unit[], fu: Unit | undefined): Person[] => {
  if (!fu) return all;
  if (units.some((u) => u.id === fu.id)) return all.filter((p) => p.deptKey === fu.id);
  const parent = units.find((u) => u.k?.some((c) => c.id === fu.id));
  if (!parent) return [];
  if (fu.id === noTeamId(parent.id)) {
    // "No team": chưa có team, hoặc team đã ngưng dùng (không có trong danh sách team đang hoạt động).
    const active = new Set(leavesOf(parent).map((l) => l.id));
    return all.filter((p) => p.deptKey === parent.id && (p.teamKey === null || !active.has(p.teamKey)));
  }
  return all.filter((p) => p.teamKey === fu.id);
};
