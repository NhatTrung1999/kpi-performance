/**
 * Hàm thuần của màn Thăng chức & lương: công thức lương, quy tắc 4C, hạn mức %, ràng buộc của BLĐ.
 * Không phụ thuộc React — unit test trong logic.test.ts.
 */
import {
  ABC_LOCK,
  EFFECTIVE_DATE,
  hasPromotion,
  hasRaise,
  HEADCOUNT_RULES,
  nextPositions,
  type BoardType,
  type ProposalType,
} from '@/config/promotion-proposal';
import { countGrade, parseAbcRatings } from '@/lib/abc';
import type { PromotionEdit, PromotionRow, ReviewGroup, SalaryInfo } from '@/services/promotionProposal';

// ───────── Công thức lương ─────────

/**
 * AA "Tổng lương hiện tại" = Lương HĐ + Tiền bình bầu + Tiền chuyên cần + Phí sinh hoạt (W + X + Y + Z).
 * File gốc ghi =SUM(T5:AA5): vừa tự cộng chính ô AA (tham chiếu vòng), vừa cộng cả cột ngày (T) và lịch sử lương (U) — sai.
 */
export const totalCurrent = (s: Pick<SalaryInfo, 'contract' | 'rating' | 'attendance' | 'living'>) =>
  s.contract + s.rating + s.attendance + s.living;

/** AG "Tổng lương sau khi tăng" = các phần mới AC + AD + AE + AF; Kế toán chưa nhập đủ → `null`. */
export const totalNew = (s: Pick<SalaryInfo, 'newContract' | 'newRating' | 'newAttendance' | 'newLiving'>) =>
  s.newContract === null || s.newRating === null || s.newAttendance === null || s.newLiving === null
    ? null
    : s.newContract + s.newRating + s.newAttendance + s.newLiving;

/** AH "Mức chênh lệch giữa cũ & mới" = Tổng sau tăng − Tổng hiện tại (`null` khi chưa có tổng sau tăng). */
export const diffOldNew = (s: Omit<SalaryInfo, 'history'>) => {
  const next = totalNew(s);
  return next === null ? null : next - totalCurrent(s);
};

/** R "Đề xuất tăng lương" ra số: không đề xuất → 0; "Theo bậc lương Cty" → `null` (TODO: chờ bảng bậc lương). */
export const proposedRaise = (r: Pick<PromotionRow, 'type' | 'raiseMode' | 'raiseAmount'>) =>
  r.type === 'none' ? 0 : r.raiseMode === 'scale' ? null : (r.raiseAmount ?? 0);

/** AM "Mức chênh lệch giữa đề xuất lương và thực tế" = Mức lương được tăng − Đề xuất tăng lương (=AL5-R5). */
export const diffProposedActual = (granted: number, proposed: number | null) => (proposed === null ? null : granted - proposed);

/** F "Thâm niên làm việc" (năm) = (ngày hiệu lực − ngày vào) / 365, như =(DATE(2026,10,1)-E5)/365. */
export const seniorityYears = (joinDate: string, effectiveDate = EFFECTIVE_DATE) => {
  const utc = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return (utc(effectiveDate) - utc(joinDate)) / 86_400_000 / 365;
};

// ───────── Quy tắc 4C ─────────

/** `locked` = CQ không được chọn đề xuất; `reasonRequired` = chọn được nhưng bắt buộc ghi lý do. */
export type ProposalLock = 'locked' | 'reasonRequired' | null;

export function proposalLock(r: Pick<PromotionRow, 'contract' | 'abc'>): ProposalLock {
  if (countGrade(parseAbcRatings(r.abc), 'C') < ABC_LOCK.cCount) return null;
  return r.contract === 'permanent' ? 'reasonRequired' : 'locked';
}

/** Lỗi của một dòng chặn việc gửi / phê duyệt. */
export type RowIssue = 'locked' | 'reasonRequired' | 'rejectReason';

/** Kiểm tra phần CQ tự điền (khi CQ đang lập đề xuất). */
export function managerIssue(r: Pick<PromotionRow, 'contract' | 'abc' | 'type' | 'reason'>): RowIssue | null {
  if (r.type === 'none') return null;
  const lock = proposalLock(r);
  if (lock === 'locked') return 'locked';
  if (lock === 'reasonRequired' && !r.reason.trim()) return 'reasonRequired';
  return null;
}

// ───────── BLĐ ─────────

/** Loại quyết định BLĐ đang áp dụng: BLĐ chưa chỉnh thì theo đề xuất của CQ ("link theo đề xuất của CQ"). */
export const boardTypeOf = (r: Pick<PromotionRow, 'type' | 'board'>): BoardType | null =>
  r.board?.type ?? (r.type === 'none' ? null : r.type);

/** AL "Mức lương được tăng": Từ chối → 0; BLĐ chưa nhập → theo đề xuất của CQ (số tiền). */
export const grantedRaise = (r: Pick<PromotionRow, 'type' | 'raiseMode' | 'raiseAmount' | 'board'>) => {
  const type = boardTypeOf(r);
  if (type === 'reject' || type === null) return 0;
  return r.board?.amount ?? proposedRaise(r) ?? 0;
};

/** Dòng Từ chối mà chưa có lý do (bắt buộc, chữ đỏ). */
export const boardIssue = (r: Pick<PromotionRow, 'type' | 'board'>): RowIssue | null =>
  boardTypeOf(r) === 'reject' && !r.board?.reason.trim() ? 'rejectReason' : null;

/** Chức danh mới được chọn: chỉ bậc kế tiếp, đúng khối VP/SX. */
export const titleOptions = (r: Pick<PromotionRow, 'position' | 'division'>) => nextPositions(r.position, r.division);

/** CQ đổi loại đề xuất: có thăng chức thì gợi ý sẵn bậc kế tiếp, không thì bỏ chức danh mới. */
export function typeChange(r: Pick<PromotionRow, 'position' | 'division' | 'newTitle'>, type: ProposalType): PromotionEdit {
  return { type, newTitle: hasPromotion(type) ? (r.newTitle ?? titleOptions(r)[0] ?? null) : null };
}

/** BLĐ đổi quyết định: Từ chối → Mức lương được tăng về 0 và bỏ chức danh mới; loại khác → lấy lại số đề xuất nếu đang 0. */
export function boardTypeChange(r: Pick<PromotionRow, 'type' | 'raiseMode' | 'raiseAmount' | 'board' | 'newTitle' | 'position' | 'division'>, type: BoardType): PromotionEdit {
  if (type === 'reject') return { boardType: 'reject', boardAmount: 0, boardTitle: null };
  return {
    boardType: type,
    boardAmount: hasRaise(type) ? (r.board?.amount || proposedRaise(r) || 0) : 0,
    boardTitle: hasPromotion(type) ? (r.board?.title ?? r.newTitle ?? titleOptions(r)[0] ?? null) : null,
  };
}

// ───────── Hạn mức % ─────────

export type QuotaMeter = { key: 'promotion' | 'raiseLocal' | 'raiseExpat'; count: number; base: number; percent: number; limit: number; over: boolean };

/**
 * Tỷ lệ thăng chức / tăng lương của một nhóm (HEADCOUNT_RULES), tính lại sau mỗi lần chọn.
 * `by: 'manager'` đếm theo đề xuất của CQ; `'board'` theo quyết định BLĐ (Từ chối không tính).
 * Thăng chức tính trên toàn nhóm; tăng lương tách local / expat (nhóm không có expat → không có đồng hồ expat).
 */
export function headcountUsage(rows: readonly PromotionRow[], group: Pick<ReviewGroup, 'headcount' | 'expatHeadcount'>, by: 'manager' | 'board'): QuotaMeter[] {
  const typeOf = (r: PromotionRow) => (by === 'board' ? boardTypeOf(r) : r.type);
  const meter = (key: QuotaMeter['key'], count: number, base: number, limit: number): QuotaMeter => {
    const percent = base > 0 ? (count / base) * 100 : 0;
    return { key, count, base, percent, limit, over: percent > limit };
  };
  const promotions = rows.filter((r) => hasPromotion(typeOf(r))).length;
  const raises = rows.filter((r) => hasRaise(typeOf(r)));
  const local = group.headcount - group.expatHeadcount;
  const meters = [
    meter('promotion', promotions, group.headcount, HEADCOUNT_RULES.promotion),
    meter('raiseLocal', raises.filter((r) => !r.expat).length, local, HEADCOUNT_RULES.raiseLocal),
  ];
  if (group.expatHeadcount > 0) meters.push(meter('raiseExpat', raises.filter((r) => r.expat).length, group.expatHeadcount, HEADCOUNT_RULES.raiseExpat));
  return meters;
}

/** Dòng "Grand Total" của sheet SUM: tổng số đề xuất và tổng nhân sự của mọi nhóm, % = tổng đề xuất / tổng nhân sự (không lấy trung bình % các nhóm). */
export type TotalUsage = { headcount: number; promotions: number; raises: number; promotionPercent: number; raisePercent: number };

export function totalUsage(groups: readonly Pick<ReviewGroup, 'headcount' | 'promotions' | 'raises'>[]): TotalUsage {
  const sum = (k: 'headcount' | 'promotions' | 'raises') => groups.reduce((n, g) => n + g[k], 0);
  const headcount = sum('headcount');
  const promotions = sum('promotions');
  const raises = sum('raises');
  const pct = (n: number) => (headcount > 0 ? (n / headcount) * 100 : 0);
  return { headcount, promotions, raises, promotionPercent: pct(promotions), raisePercent: pct(raises) };
}
