import { ABC_RULES, RESULT_TONE } from '@/config/kpi-proposal';
import type { ProposalRow } from '@/services/kpiProposal';

/** Lỗi quy tắc bình bầu A-B-C của một dòng (xem ABC_RULES). */
export type RowIssue = 'mustReduce' | 'capIncrease';

/** Số tiền kỳ này (chưa nhập = 0). */
export const nextOf = (row: Pick<ProposalRow, 'next'>) => row.next ?? 0;

/** Diff = số kỳ này − số kỳ trước. */
export const diffOf = (row: Pick<ProposalRow, 'next' | 'prev'>) => nextOf(row) - row.prev;

/** % thay đổi so với kỳ trước; kỳ trước = 0 thì không tính được → `null`. */
export const percentOf = (prev: number, next: number) => (prev === 0 ? null : ((next - prev) / prev) * 100);

export function validateRow(row: ProposalRow): RowIssue | null {
  const c = row.abc.C;
  if (c >= ABC_RULES.mustReduceAt && !ABC_RULES.reduceResults.includes(row.result)) return 'mustReduce';
  if (c === ABC_RULES.capAt && diffOf(row) > ABC_RULES.maxIncrease) return 'capIncrease';
  return null;
}

/** Nền xám: tạm hoãn KPI hoặc nhân viên sắp thôi việc. */
export const isMutedRow = (row: ProposalRow) => row.result === 'suspend' || row.status === 'resigning';

/** Màu chữ theo kết quả đánh giá: giảm/hủy đỏ, tăng/thêm mới xanh dương, giữ nguyên chữ thường. */
export const rowTextClass = (row: ProposalRow) =>
  ({ down: 'text-danger-text', up: 'text-info', neutral: 'text-foreground' })[RESULT_TONE[row.result]];

/** Bình bầu dạng "1A, 2C" (bỏ loại 0 lần). */
export const formatAbc = (abc: ProposalRow['abc']) =>
  (['A', 'B', 'C'] as const)
    .filter((k) => abc[k] > 0)
    .map((k) => `${abc[k]}${k}`)
    .join(', ');
