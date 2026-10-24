import { describe, expect, it, vi } from 'vitest';
import { canEdit, canView, GROUP_VIEW, nextPositions } from '@/config/promotion-proposal';
import { formatMoney } from '@/lib/format';
import { SAMPLE_GROUP_OF, SAMPLE_ROWS, applyEdit, orgChartError, visibleRow, type PromotionRow } from '@/services/promotionProposal';
import {
  boardIssue,
  boardTypeOf,
  boardTypeChange,
  diffOldNew,
  diffProposedActual,
  grantedRaise,
  headcountUsage,
  managerIssue,
  proposalLock,
  proposedRaise,
  seniorityYears,
  totalCurrent,
  totalNew,
  totalUsage,
  typeChange,
} from './logic';

// format.ts đọc ngôn ngữ từ i18n (cần DOM); số tiền theo quy ước kế toán không phụ thuộc ngôn ngữ.
vi.mock('@/i18n', () => ({ default: { language: 'vi' } }));

const row = (psk: string): PromotionRow => SAMPLE_ROWS.find((x) => x.psk === psk)!;
const A = row('tr01'); // NGUYỄN VĂN A
const C = row('tr03'); // LÝ VĂN C

describe('công thức lương', () => {
  it('Tổng lương hiện tại = Lương HĐ + Tiền bình bầu + Tiền chuyên cần + Phí sinh hoạt', () => {
    expect(totalCurrent(A.salary!)).toBe(10_120_000 + 500_000 + 300_000 + 1_000_000);
  });

  it('chống lỗi =SUM(T5:AA5) của file gốc: tổng chỉ gồm đúng 4 khoản, không cộng ngày, lịch sử lương hay chính nó', () => {
    const s = A.salary!;
    const four = s.contract + s.rating + s.attendance + s.living;
    // Mô phỏng ô Excel: T = các ngày điều chỉnh (số serial), U = lịch sử lương, W–Z = 4 khoản, AA = chính ô tổng.
    const serial = (iso: string) => (Date.parse(`${iso}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86_400_000;
    const columnT = s.history.reduce((sum, h) => sum + serial(h.date), 0);
    const columnU = s.history.reduce((sum, h) => sum + h.amount, 0);
    const excelSum = columnT + columnU + four + four; // AA tự cộng chính nó (tham chiếu vòng, giả sử lần lặp đầu)

    expect(totalCurrent(s)).toBe(four);
    expect(totalCurrent(s)).toBe(11_920_000);
    expect(totalCurrent(s)).not.toBe(excelSum);
    // Thêm lịch sử lương hay ngày mới không làm đổi tổng.
    const more = { ...s, history: [...s.history, { date: '2026-04-01', amount: 99_000_000 }] };
    expect(totalCurrent(more)).toBe(four);
  });

  it('Tổng sau tăng = Lương HĐ mới + bình bầu + chuyên cần + phí sinh hoạt (phần mới); thiếu một khoản → chưa tính', () => {
    expect(totalNew(A.salary!)).toBe(11_120_000 + 500_000 + 300_000 + 1_000_000);
    expect(totalNew({ ...A.salary!, newLiving: null })).toBeNull();
  });

  it('Chênh lệch cũ & mới = Tổng sau tăng − Tổng hiện tại', () => {
    expect(diffOldNew(A.salary!)).toBe(1_000_000);
    expect(diffOldNew(C.salary!)).toBeNull();
  });

  it('Chênh lệch đề xuất & thực tế = Mức lương được tăng − Đề xuất tăng lương: Lý Văn C ra (1,000,000)', () => {
    const diff = diffProposedActual(grantedRaise(C), proposedRaise(C));
    expect(diff).toBe(-1_000_000);
    expect(formatMoney(diff!)).toBe('(1,000,000)');
    expect(diffProposedActual(grantedRaise(A), proposedRaise(A))).toBe(0);
  });

  it('"Theo bậc lương Cty" chưa có số tiền → không tính chênh lệch', () => {
    expect(proposedRaise({ type: 'raise', raiseMode: 'scale', raiseAmount: 700_000 })).toBeNull();
    expect(diffProposedActual(500_000, null)).toBeNull();
    expect(proposedRaise({ type: 'none', raiseMode: 'amount', raiseAmount: 700_000 })).toBe(0);
  });

  it('thâm niên theo công thức =(DATE(2026,10,1)-E5)/365', () => {
    expect(seniorityYears('2017-06-19')).toBeCloseTo(3391 / 365, 10);
    expect(seniorityYears('2026-10-01')).toBe(0);
  });
});

describe('quy tắc 4C trong 12 tháng', () => {
  it('chưa ký HĐ vô thời hạn + 4C → khóa (không được đề xuất)', () => {
    expect(proposalLock({ contract: 'fixed', abc: '2B, 4C' })).toBe('locked');
    expect(proposalLock({ contract: null, abc: '2B, 4C' })).toBe('locked');
    expect(managerIssue({ contract: 'fixed', abc: '4C', type: 'raise', reason: 'Có lý do' })).toBe('locked');
  });

  it('đã ký HĐ vô thời hạn + 4C → chọn được nhưng bắt buộc ghi lý do', () => {
    expect(proposalLock({ contract: 'permanent', abc: '4C, 2B' })).toBe('reasonRequired');
    expect(managerIssue({ contract: 'permanent', abc: '4C', type: 'raise', reason: '  ' })).toBe('reasonRequired');
    expect(managerIssue({ contract: 'permanent', abc: '4C', type: 'raise', reason: 'Lý do cụ thể' })).toBeNull();
    expect(managerIssue({ contract: 'permanent', abc: '4C', type: 'none', reason: '' })).toBeNull();
  });

  it('dưới 4C không ảnh hưởng; đọc số C qua parseAbcRatings (gộp nhiều phần, không phân biệt khoảng trắng)', () => {
    expect(proposalLock({ contract: 'fixed', abc: '4B, 1A, 1C' })).toBeNull();
    expect(proposalLock({ contract: 'fixed', abc: '3C' })).toBeNull();
    expect(proposalLock({ contract: 'fixed', abc: '2c,2C' })).toBe('locked');
  });
});

describe('chức danh mới', () => {
  it('chỉ cho chọn bậc kế tiếp, đúng khối', () => {
    expect(nextPositions('NV', 'office')).toEqual(['TBP']);
    expect(nextPositions('PP', 'office')).toEqual(['TRP']);
    expect(nextPositions('PCN', 'office')).toEqual([]);
    // Khối SX chưa có danh sách (TODO) → chưa có chức danh để chọn.
    expect(nextPositions('NV', 'production')).toEqual([]);
  });

  it('chọn thăng chức gợi ý sẵn bậc kế tiếp; bỏ thăng chức thì bỏ chức danh', () => {
    expect(typeChange({ position: 'NV', division: 'office', newTitle: null }, 'promotion')).toEqual({ type: 'promotion', newTitle: 'TBP' });
    expect(typeChange({ position: 'NV', division: 'office', newTitle: 'TBP' }, 'raise')).toEqual({ type: 'raise', newTitle: null });
  });
});

describe('BLĐ', () => {
  it('chọn Từ chối → Mức lương được tăng về 0 và bỏ chức danh mới', () => {
    expect(boardTypeChange(A, 'reject')).toEqual({ boardType: 'reject', boardAmount: 0, boardTitle: null });
    const rejected = applyEdit(A, boardTypeChange(A, 'reject'));
    expect(grantedRaise(rejected)).toBe(0);
  });

  it('Từ chối bắt buộc có lý do; chọn lại loại khác thì lấy lại số đề xuất', () => {
    expect(boardIssue(C)).toBe('rejectReason');
    expect(boardIssue(applyEdit(C, { boardReason: 'Có 4C trong 12 tháng' }))).toBeNull();
    expect(boardTypeChange(C, 'promotion')).toEqual({ boardType: 'promotion', boardAmount: 0, boardTitle: 'TBP' });
    expect(boardTypeChange(C, 'both')).toMatchObject({ boardAmount: 1_000_000 });
  });

  it('Tăng lương / Thăng chức + tăng lương bắt buộc Mức lương được tăng > 0', () => {
    expect(boardIssue(applyEdit(A, { boardType: 'raise', boardAmount: 0 }))).toBe('grantedRequired');
    expect(boardIssue(applyEdit(A, { boardType: 'both', boardAmount: 0 }))).toBe('grantedRequired');
    expect(boardIssue(applyEdit(A, { boardType: 'raise', boardAmount: 1 }))).toBeNull();
    // Chỉ thăng chức: không tăng lương nên 0 là hợp lệ.
    expect(boardIssue(applyEdit(A, { boardType: 'promotion', boardAmount: 0 }))).toBeNull();
    // BLĐ chưa nhập: theo đề xuất CQ; "Theo bậc lương Cty" chưa có số → 0 → phải nhập.
    const scale = applyEdit(A, { boardType: 'raise', boardAmount: null, raiseMode: 'scale' });
    expect(grantedRaise(scale)).toBe(0);
    expect(boardIssue(scale)).toBe('grantedRequired');
  });

  it('dữ liệu mẫu: PHẠM THỊ D được Tăng lương 1,000,000; TRANSFER TEAM chỉ còn dòng Từ chối chưa có lý do', () => {
    const D = row('tr04');
    expect(boardTypeOf(D)).toBe('raise');
    expect(grantedRaise(D)).toBe(1_000_000);
    expect(boardIssue(D)).toBeNull();
    const issues = SAMPLE_ROWS.filter((r) => SAMPLE_GROUP_OF[r.psk] === 'transfer').map((r) => [r.psk, boardIssue(r)]).filter(([, i]) => i);
    expect(issues).toEqual([['tr03', 'rejectReason']]);
  });
});

describe('hạn mức theo nhóm', () => {
  const group = { headcount: 40, expatHeadcount: 2 };
  const rows = SAMPLE_ROWS.filter((r) => SAMPLE_GROUP_OF[r.psk] === 'transfer');

  it('đếm theo đề xuất CQ, tách tăng lương local / expat', () => {
    const [promo, local, expat] = headcountUsage(rows, group, 'manager');
    expect(promo).toMatchObject({ count: 2, base: 40, percent: 5, limit: 5, over: false });
    expect(local).toMatchObject({ count: 3, base: 38, limit: 10, over: false });
    expect(expat).toMatchObject({ count: 0, base: 2, limit: 5 });
  });

  it('cập nhật mỗi lần chọn; vượt hạn mức thì báo (không chặn)', () => {
    const ticked = rows.map((r) => (r.psk === 'tr05' ? { ...r, type: 'promotion' as const } : r));
    expect(headcountUsage(ticked, group, 'manager')[0]).toMatchObject({ count: 3, percent: 7.5, over: true });
  });

  it('theo quyết định BLĐ: dòng Từ chối không tính', () => {
    expect(headcountUsage(rows, group, 'board')[0]).toMatchObject({ count: 1 });
  });

  it('nhóm không có expat thì không có đồng hồ expat', () => {
    expect(headcountUsage(rows, { headcount: 40, expatHeadcount: 0 }, 'manager')).toHaveLength(2);
  });
});

describe('tổng toàn TTKT (sheet SUM)', () => {
  // 3 dòng của sheet SUM: CC PLANNING 8/1/1, VR 31/2/2, Basketball 33/0/3.
  const groups = [
    { headcount: 8, promotions: 1, raises: 1 },
    { headcount: 31, promotions: 2, raises: 2 },
    { headcount: 33, promotions: 0, raises: 3 },
  ];

  it('Grand Total = tổng đề xuất / tổng nhân sự, không phải trung bình % các nhóm', () => {
    const total = totalUsage(groups);
    expect(total).toMatchObject({ headcount: 72, promotions: 3, raises: 6 });
    expect(total.promotionPercent).toBeCloseTo((3 / 72) * 100, 10);
    expect(total.raisePercent).toBeCloseTo((6 / 72) * 100, 10);
  });

  it('không có nhóm nào → 0%', () => {
    expect(totalUsage([])).toEqual({ headcount: 0, promotions: 0, raises: 0, promotionPercent: 0, raisePercent: 0 });
  });
});

describe('quyền theo nhóm cột', () => {
  it('CQ chỉ thấy 3 nhóm; Admin thấy tất cả trừ lương; HR, KT, BLĐ thấy tất cả', () => {
    expect(GROUP_VIEW.CQ).toEqual(['hr', 'cq', 'kpi']);
    expect(canView('AD', 'salary', true)).toBe(false);
    expect(canView('AD', 'board', true)).toBe(true);
    // Hiện tại chưa ẩn (HIDE_GROUPS_BY_ROLE = false): mọi vai trò xem được mọi nhóm.
    expect(canView('CQ', 'salary')).toBe(true);
    for (const role of ['HR', 'KT', 'BLD'] as const) expect(GROUP_VIEW[role]).toHaveLength(6);
  });

  it('mỗi vai trò chỉ sửa phần của mình, đúng trạng thái', () => {
    expect(canEdit('CQ', 'draft', 'type')).toBe(true);
    expect(canEdit('CQ', 'returned', 'raise')).toBe(true);
    expect(canEdit('CQ', 'submitted', 'type')).toBe(false);
    expect(canEdit('HR', 'submitted', 'hrOpinion')).toBe(true);
    expect(canEdit('HR', 'submitted', 'newContract')).toBe(false);
    expect(canEdit('KT', 'submitted', 'newContract')).toBe(true);
    expect(canEdit('KT', 'submitted', 'hrOpinion')).toBe(false);
    expect(canEdit('BLD', 'submitted', 'boardAmount')).toBe(true);
    expect(canEdit('BLD', 'submitted', 'type')).toBe(false);
    expect(canEdit('AD', 'submitted', 'hrOpinion')).toBe(false);
  });

  it('service bỏ hẳn trường lương (và nhóm không được xem) khỏi dữ liệu trả về', () => {
    const cq = visibleRow(A, 'CQ', true);
    expect(cq).not.toHaveProperty('salary');
    expect(cq).not.toHaveProperty('hrOpinion');
    expect(cq).not.toHaveProperty('board');
    expect(JSON.stringify(cq)).not.toContain('10120000');
    const admin = visibleRow(A, 'AD', true);
    expect(admin).not.toHaveProperty('salary');
    expect(admin).toHaveProperty('board');
    expect(visibleRow(A, 'KT', true)).toHaveProperty('salary');
    // Chưa bật ẩn: trả đủ.
    expect(visibleRow(A, 'CQ')).toHaveProperty('salary');
  });
});

describe('sơ đồ tổ chức', () => {
  it('chỉ nhận PDF, PNG, JPG ≤ 10MB', () => {
    expect(orgChartError({ name: 'a.pdf', size: 1_000, type: 'application/pdf' })).toBeNull();
    expect(orgChartError({ name: 'a.JPG', size: 10 * 1024 * 1024, type: '' })).toBeNull();
    expect(orgChartError({ name: 'a.docx', size: 1_000, type: 'application/msword' })).toBe('type');
    expect(orgChartError({ name: 'a.png', size: 10 * 1024 * 1024 + 1, type: 'image/png' })).toBe('size');
  });
});
