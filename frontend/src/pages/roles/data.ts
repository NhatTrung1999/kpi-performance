import type { AppRole } from '@/lib/session';

export type Unit = { id: string; n: string; c?: number; k?: Unit[] };
export type Role = AppRole | 'NONE';
export type Person = { name: string; id: string; dept: string; /** Ngày vào công ty, ISO `YYYY-MM-DD`; hiển thị qua `formatDate`. */ join: string };

/** Tên đơn vị lấy từ hệ thống, có thể ở dạng "Tên-中文"; giao diện chỉ hiển thị phần trước dấu "-" (xem `unitLabel`). */
export const UNITS: Unit[] = [
  {
    id: 'kt',
    n: 'TRUNG TAM KHAI THAC MAU-樣品開發中心',
    k: [
      { id: 'bb', n: 'BASKETBALL', c: 9 },
      { id: 'pbb', n: 'PATTERN_BB', c: 6 },
      { id: 'tbb', n: 'TECH_BB', c: 4 },
      { id: 'ast', n: 'AST', c: 3 },
    ],
  },
  { id: 'it', n: 'IT SOFTWARE', c: 7 },
  { id: 'svtt', n: 'SINH VIEN THUC TAP', c: 5 },
];

const NAMES: [string, string][] = [
  ['NGUYỄN THỊ LAN', '10234'], ['TRẦN VĂN HÙNG', '10567'], ['LÊ THỊ HỒNG NHUNG', '11082'],
  ['PHẠM MINH TUẤN', '09815'], ['HOÀNG THỊ THU TRANG', '12406'], ['VÕ VĂN PHÚC', '12931'],
  ['ĐẶNG THỊ MAI', '10778'], ['BÙI QUANG HUY', '11564'], ['ĐỖ THỊ NGỌC ÁNH', '13047'],
  ['HUỲNH VĂN LỢI', '09952'], ['NGÔ THỊ KIM YẾN', '13310'], ['DƯƠNG MINH KHANG', '12089'],
  ['LÝ THỊ BÍCH HẠNH', '11736'], ['PHAN VĂN TÀI', '13582'], ['TRƯƠNG THỊ THANH HÀ', '10419'],
  ['LÂM QUỐC BẢO', '09687'], ['MAI THỊ DIỄM', '13865'], ['CHÂU VĂN NAM', '12254'],
  ['TẠ THỊ HOÀI', '11903'], ['HỒ MINH TRÍ', '08946'], ['KIỀU THỊ NGÂN', '14127'],
  ['LA VĂN ĐẠT', '13698'],
];

const deptOf = (i: number) => (i < 9 ? 'BASKETBALL' : i < 15 ? 'PATTERN_BB' : i < 19 ? 'TECH_BB' : 'AST');
const pad = (n: number) => String(n).padStart(2, '0');

export const PEOPLE: Person[] = NAMES.map(([name, id], i) => ({
  name,
  id,
  dept: deptOf(i),
  join: `${2015 + ((i * 7) % 11)}-${pad(1 + ((i * 5) % 12))}-${pad(1 + ((i * 11) % 28))}`,
}));

/** Vai trò và phạm vi đã lưu (mặc định mọi người là Nhân viên). */
export const INITIAL_ROLES: Record<number, Role> = { 3: 'CQ', 6: 'CQ', 12: 'CQ', 15: 'CQ', 19: 'AD', 10: 'NONE', 17: 'NONE', 20: 'NONE', 21: 'NONE', 7: 'CQ' };
export const INITIAL_SCOPES: Record<number, string[]> = { 3: ['bb', 'pbb', 'tbb'], 6: ['bb'], 12: ['it'], 15: [], 7: ['ast'] };

/** Thứ tự vai trò trong menu chọn / bộ lọc; nhãn và mô tả lấy từ i18n (namespace `roles`). */
export const ROLE_OPTION_KEYS = ['NV', 'CQ', 'AD'] as const;
export const ROLE_FILTER_KEYS = ['all', 'NV', 'CQ', 'AD'] as const;

/** Tên đơn vị hiển thị: bỏ phần chữ Hán sau dấu "-". */
export const unitLabel = (n: string) => {
  const d = n.indexOf('-');
  return d > 0 && /[一-鿿]/.test(n.slice(d)) ? n.slice(0, d) : n;
};

export const norm = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const leavesOf = (u: Unit): Unit[] => (u.k ? u.k.flatMap(leavesOf) : [u]);
export const ALL_LEAVES = UNITS.flatMap(leavesOf);
export const LEAF_BY_ID = Object.fromEntries(ALL_LEAVES.map((l) => [l.id, l]));
export const countOf = (u: Unit) => leavesOf(u).reduce((a, l) => a + (l.c ?? 0), 0);
export const findUnit = (id: string) => UNITS.find((u) => u.id === id) ?? UNITS.flatMap((u) => u.k ?? []).find((u) => u.id === id);
