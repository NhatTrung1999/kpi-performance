import type { AppRole } from '@/lib/session';

export type Unit = { id: string; n: string; c?: number; k?: Unit[] };
export type Role = AppRole | 'NONE';
export type Person = { name: string; zh: string; id: string; dept: string; join: string };

/** Tên đơn vị dạng "VI-中文"; phần sau dấu "-" là chữ Hán (nếu có). */
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

const NAMES: [string, string, string][] = [
  ['NGUYỄN THỊ LAN', '阮氏蘭', '10234'], ['TRẦN VĂN HÙNG', '陳文雄', '10567'], ['LÊ THỊ HỒNG NHUNG', '黎氏紅絨', '11082'],
  ['PHẠM MINH TUẤN', '范明俊', '09815'], ['HOÀNG THỊ THU TRANG', '黃氏秋莊', '12406'], ['VÕ VĂN PHÚC', '武文福', '12931'],
  ['ĐẶNG THỊ MAI', '鄧氏梅', '10778'], ['BÙI QUANG HUY', '裴光輝', '11564'], ['ĐỖ THỊ NGỌC ÁNH', '杜氏玉映', '13047'],
  ['HUỲNH VĂN LỢI', '黃文利', '09952'], ['NGÔ THỊ KIM YẾN', '吳氏金燕', '13310'], ['DƯƠNG MINH KHANG', '楊明康', '12089'],
  ['LÝ THỊ BÍCH HẠNH', '李氏碧幸', '11736'], ['PHAN VĂN TÀI', '潘文才', '13582'], ['TRƯƠNG THỊ THANH HÀ', '張氏青河', '10419'],
  ['LÂM QUỐC BẢO', '林國寶', '09687'], ['MAI THỊ DIỄM', '枚氏艷', '13865'], ['CHÂU VĂN NAM', '周文南', '12254'],
  ['TẠ THỊ HOÀI', '謝氏懷', '11903'], ['HỒ MINH TRÍ', '胡明智', '08946'], ['KIỀU THỊ NGÂN', '喬氏銀', '14127'],
  ['LA VĂN ĐẠT', '羅文達', '13698'],
];

const deptOf = (i: number) => (i < 9 ? 'BASKETBALL' : i < 15 ? 'PATTERN_BB' : i < 19 ? 'TECH_BB' : 'AST');
const pad = (n: number) => String(n).padStart(2, '0');

export const PEOPLE: Person[] = NAMES.map(([name, zh, id], i) => ({
  name,
  zh,
  id,
  dept: deptOf(i),
  join: `${pad(1 + ((i * 11) % 28))}/${pad(1 + ((i * 5) % 12))}/${2015 + ((i * 7) % 11)}`,
}));

/** Vai trò và phạm vi đã lưu (mặc định mọi người là Nhân viên). */
export const INITIAL_ROLES: Record<number, Role> = { 3: 'CQ', 6: 'CQ', 12: 'CQ', 15: 'CQ', 19: 'AD', 10: 'NONE', 17: 'NONE', 20: 'NONE', 21: 'NONE', 7: 'CQ' };
export const INITIAL_SCOPES: Record<number, string[]> = { 3: ['bb', 'pbb', 'tbb'], 6: ['bb'], 12: ['it'], 15: [], 7: ['ast'] };

export const ROLE_OPTIONS: { key: Exclude<Role, 'NONE'>; vi: string; zh: string; desc: string }[] = [
  { key: 'NV', vi: 'Nhân viên', zh: '員工', desc: 'Xem và cập nhật KPI của bản thân' },
  { key: 'CQ', vi: 'Chủ quản', zh: '主管', desc: 'Quản lý nhân viên trong phạm vi bộ phận được giao' },
  { key: 'AD', vi: 'Admin', zh: '管理員', desc: 'Toàn quyền hệ thống, gồm cả phân quyền' },
];

export const ROLE_LABEL: Record<Role, string> = { NV: 'Nhân viên', CQ: 'Chủ quản', AD: 'Admin', NONE: 'Chưa phân quyền' };

export const ROLE_FILTERS: { key: 'all' | Role; vi: string; zh: string }[] = [
  { key: 'all', vi: 'Tất cả', zh: '全部' },
  { key: 'NV', vi: 'Nhân viên', zh: '員工' },
  { key: 'CQ', vi: 'Chủ quản', zh: '主管' },
  { key: 'AD', vi: 'Admin', zh: '管理員' },
];

export const parseName = (n: string) => {
  const d = n.indexOf('-');
  const hasZh = d > 0 && /[\u4e00-\u9fff]/.test(n.slice(d));
  return { vi: hasZh ? n.slice(0, d) : n, zh: hasZh ? n.slice(d + 1) : '' };
};

export const norm = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const leavesOf = (u: Unit): Unit[] => (u.k ? u.k.flatMap(leavesOf) : [u]);
export const ALL_LEAVES = UNITS.flatMap(leavesOf);
export const LEAF_BY_ID = Object.fromEntries(ALL_LEAVES.map((l) => [l.id, l]));
export const countOf = (u: Unit) => leavesOf(u).reduce((a, l) => a + (l.c ?? 0), 0);
export const findUnit = (id: string) => UNITS.find((u) => u.id === id) ?? UNITS.flatMap((u) => u.k ?? []).find((u) => u.id === id);
