import type { TFunction } from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COLUMN_GROUPS, COLUMN_KEYS, SALARY_SUBGROUPS, visibleColumns } from '@/config/promotion-proposal';
import en from '@/i18n/locales/en/promotion.json';
import viLocale from '@/i18n/locales/vi/promotion.json';
import type { AppRole } from '@/lib/session';
import { getPromotionProposal } from '@/services/promotionProposal';
import { loadCollapsed, saveCollapsed } from './collapsed-groups';
import { buildColumns } from './columns';
import { SPEC_COLUMNS, SPEC_GROUPS } from './spec-headers.fixture';

// format.ts đọc ngôn ngữ từ i18n (cần DOM).
vi.mock('@/i18n', () => ({ default: { language: 'vi' } }));

const ALL = COLUMN_GROUPS.flatMap((g) => COLUMN_KEYS[g]);
/** Cột lương = cột 20–34 (T–AH) của file. */
const SALARY = new Set<string>(COLUMN_KEYS.salary);

const t = ((key: string) => key) as unknown as TFunction<'promotion'>;
const build = (role: AppRole) => buildColumns({ t, role, status: 'draft', issues: new Map(), edit: () => {}, collapsed: new Set(), toggle: () => {} });

describe('tiêu đề nguyên văn sheet 2026年07月名單', () => {
  it('đủ 40 cột, tiêu đề tiếng Việt và tiếng Trung trong i18n (vi) khớp từng chữ với file, đúng thứ tự', () => {
    expect(ALL).toHaveLength(40);
    expect(ALL.map((k) => viLocale.cols[k].label)).toEqual(SPEC_COLUMNS.map((c) => c.vi));
    expect(ALL.map((k) => viLocale.cols[k].sub)).toEqual(SPEC_COLUMNS.map((c) => c.cn));
  });

  it('6 nhãn nhóm khớp từng chữ với dòng 3 của file', () => {
    expect(COLUMN_GROUPS.map((g) => viLocale.groups[g].label)).toEqual(SPEC_GROUPS.map((g) => g.vi));
    expect(COLUMN_GROUPS.map((g) => viLocale.groups[g].sub)).toEqual(SPEC_GROUPS.map((g) => g.cn));
    // Nhóm bắt đầu đúng cột A, N, S, T, AI, AJ.
    let i = 0;
    const starts = COLUMN_GROUPS.map((g) => {
      const at = SPEC_COLUMNS[i].cell;
      i += COLUMN_KEYS[g].length;
      return at;
    });
    expect(starts).toEqual(SPEC_GROUPS.map((g) => g.cell));
  });

  it('i18n en có đủ đúng các key cột của vi (không thừa, không thiếu)', () => {
    expect(Object.keys(en.cols).sort()).toEqual([...ALL].sort());
    expect(Object.keys(viLocale.cols).sort()).toEqual([...ALL].sort());
  });

  it('cột 24–26 và 30–32 trùng tên trong file nhưng key khác nhau, nằm dưới 2 nhóm con Hiện tại / Sau khi tăng', () => {
    const at = (n: number) => ALL[n - 1];
    expect([24, 25, 26].map(at)).toEqual(['currentRating', 'currentAttendance', 'currentLiving']);
    expect([30, 31, 32].map(at)).toEqual(['newRating', 'newAttendance', 'newLiving']);
    expect([24, 25, 26].map((n) => viLocale.cols[at(n)].label)).toEqual([30, 31, 32].map((n) => viLocale.cols[at(n)].label));
    expect(SALARY_SUBGROUPS.map((s) => [s.from, s.span])).toEqual([
      ['currentRating', 3],
      ['newRating', 3],
    ]);
    expect(viLocale.subgroups).toEqual({ current: { label: 'Hiện tại', sub: '目前' }, after: { label: 'Sau khi tăng', sub: '調整後' } });
    const salary = build('BLD').groups.find((g) => g.key === 'salary');
    expect(salary?.subgroups?.map((s) => s.from)).toEqual(['currentRating', 'newRating']);
  });
});

describe('số cột theo vai trò (GROUP_VIEW)', () => {
  it('BLĐ, HR, Kế toán thấy đủ 40 cột', () => {
    for (const role of ['BLD', 'HR', 'KT'] as const) {
      expect(visibleColumns(role)).toEqual(ALL);
      expect(build(role).columns.map((c) => c.key)).toEqual(ALL);
    }
  });

  it('Chủ quản thấy đúng 19 cột 1–19 (A–S)', () => {
    expect(visibleColumns('CQ')).toEqual(ALL.slice(0, 19));
    const { columns, groups } = build('CQ');
    expect(columns.map((c) => c.key)).toEqual(ALL.slice(0, 19));
    expect(groups.map((g) => g.key)).toEqual(['hr', 'cq', 'kpi']);
    expect(SPEC_COLUMNS[18].cell).toBe('S');
  });

  it('Admin thấy 25 cột: 40 trừ 15 cột lương 20–34 (TODO chị Kitty: xác nhận)', () => {
    const cols = build('AD').columns.map((c) => c.key);
    expect(cols).toHaveLength(25);
    expect(cols).toEqual(visibleColumns('AD'));
    expect(cols.filter((k) => SALARY.has(k))).toEqual([]);
    expect(ALL.slice(19, 34)).toEqual([...COLUMN_KEYS.salary]);
  });

  it('tổng span các nhóm bằng số cột (DataGrid yêu cầu)', () => {
    for (const role of ['CQ', 'AD', 'BLD'] as const) {
      const { columns, groups } = build(role);
      expect(groups.reduce((s, g) => s + g.span, 0)).toBe(columns.length);
    }
  });
});

describe('service mẫu không trả trường lương cho Chủ quản và Admin', () => {
  it('getPromotionProposal: CQ và Admin không có `salary`, Kế toán có', async () => {
    const cq = await getPromotionProposal({ role: 'CQ', email: 'chuquan.dev@example.com' });
    const admin = await getPromotionProposal({ role: 'AD', email: 'admin.dev@example.com' }, 'transfer');
    const kt = await getPromotionProposal({ role: 'KT', email: 'ketoan.dev@example.com' }, 'transfer');
    expect(cq.rows.length).toBeGreaterThan(0);
    expect(admin.rows.length).toBeGreaterThan(0);
    for (const r of [...cq.rows, ...admin.rows]) expect(r).not.toHaveProperty('salary');
    for (const r of kt.rows) expect(r).toHaveProperty('salary');
  });
});

describe('nhớ nhóm cột thu gọn theo người dùng', () => {
  afterEach(() => vi.unstubAllGlobals());

  const memoryStorage = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
  };

  it('lưu và đọc lại riêng cho từng người', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    saveCollapsed('a@x', new Set(['salary', 'hr']));
    expect([...loadCollapsed('a@x')].sort()).toEqual(['hr', 'salary']);
    expect(loadCollapsed('b@x').size).toBe(0);
    saveCollapsed('a@x', new Set());
    expect(loadCollapsed('a@x').size).toBe(0);
  });

  it('dữ liệu hỏng, nhóm lạ hoặc storage bị chặn → không thu gọn nhóm nào, không lỗi', () => {
    const store = memoryStorage();
    vi.stubGlobal('localStorage', store);
    store.setItem('promotion.collapsedGroups.a@x', '{oops');
    expect(loadCollapsed('a@x').size).toBe(0);
    store.setItem('promotion.collapsedGroups.a@x', '["salary","bogus"]');
    expect([...loadCollapsed('a@x')]).toEqual(['salary']);
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadCollapsed('a@x').size).toBe(0);
    expect(() => saveCollapsed('a@x', new Set(['hr']))).not.toThrow();
  });
});
