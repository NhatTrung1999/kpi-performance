import { ABC_RULES, RESULT_TONE } from '@/config/kpi-proposal';
import { countGrade, parseAbcRatings, type AbcRating } from '@/lib/abc';
import type { ProposalRow } from '@/services/kpiProposal';

/** Lỗi quy tắc bình bầu A-B-C của một dòng (xem ABC_RULES). */
export type RowIssue = 'mustReduce' | 'capIncrease';

/** Số tiền kỳ này (chưa nhập = 0). */
export const nextOf = (row: Pick<ProposalRow, 'next'>) => row.next ?? 0;

/** Chênh lệch = số kỳ này − số kỳ trước. */
export const diffOf = (row: Pick<ProposalRow, 'next' | 'prev'>) => nextOf(row) - row.prev;

/** Dòng tổng: cộng TẤT CẢ các dòng truyền vào (kể cả dòng nền xám, dòng bằng 0, dòng chưa nhập kỳ này). */
export function summarize(rows: readonly Pick<ProposalRow, 'prev' | 'next'>[]) {
  const prev = rows.reduce((s, r) => s + r.prev, 0);
  const next = rows.reduce((s, r) => s + nextOf(r), 0);
  return { count: rows.length, prev, next, diff: next - prev };
}

export function validateRow(row: Pick<ProposalRow, 'abc' | 'result' | 'prev' | 'next'>): RowIssue | null {
  const c = countGrade(parseAbcRatings(row.abc), 'C');
  if (c >= ABC_RULES.mustReduceAt && !ABC_RULES.reduceResults.includes(row.result)) return 'mustReduce';
  if (c === ABC_RULES.capAt && diffOf(row) > ABC_RULES.maxIncrease) return 'capIncrease';
  return null;
}

/** Màu chip bình bầu theo quy tắc ABC (không theo màu của dòng). */
export const abcChipTone = (r: AbcRating) =>
  r.grade !== 'C' ? 'neutral' : r.count >= ABC_RULES.mustReduceAt ? 'danger' : r.count === ABC_RULES.capAt ? 'warning' : 'neutral';

/** Nền xám: tạm hoãn KPI hoặc nhân viên sắp thôi việc. */
export const isMutedRow = (row: Pick<ProposalRow, 'result' | 'status'>) => row.result === 'suspend' || row.status === 'resigning';

/** Màu chữ của các ô chính (Họ tên, Kết quả, Kỳ này, Chênh lệch) theo kết quả đánh giá. */
export const resultTextClass = (row: Pick<ProposalRow, 'result'>) =>
  ({ down: 'text-danger-text', up: 'text-info', neutral: 'text-foreground' })[RESULT_TONE[row.result]];

/** Vạch màu 3px ở mép trái dòng; giữ nguyên dùng xám trung tính cho nhẹ. */
export const resultAccentClass = (row: Pick<ProposalRow, 'result'>) =>
  ({ down: 'bg-danger-text', up: 'bg-info', neutral: 'bg-muted-foreground' })[RESULT_TONE[row.result]];
