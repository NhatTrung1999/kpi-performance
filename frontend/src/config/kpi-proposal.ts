/**
 * Cấu hình nghiệp vụ trang Đề xuất KPI — một nơi duy nhất, trang, service mẫu và kiểm tra đều đọc từ đây.
 * Sau này có thể lấy từ cấu hình do admin quản lý (kỳ đánh giá).
 */
import type { AppRole } from '@/lib/session';

/** Kết quả đánh giá (thiết lập sẵn & cho chọn). Thứ tự = thứ tự trong danh sách chọn. */
export const PROPOSAL_RESULTS = ['suspend', 'sick', 'cancel', 'maintain', 'increase', 'reduce', 'add'] as const;
export type ProposalResult = (typeof PROPOSAL_RESULTS)[number];

/** Màu theo kết quả (tô Họ tên, Kết quả, Kỳ này, Chênh lệch và vạch trái của dòng): giảm/hủy đỏ, tăng/thêm mới xanh dương. */
export const RESULT_TONE: Record<ProposalResult, 'down' | 'up' | 'neutral'> = {
  suspend: 'neutral',
  sick: 'down',
  cancel: 'down',
  maintain: 'neutral',
  increase: 'up',
  reduce: 'down',
  add: 'up',
};

/**
 * Quy tắc bình bầu A-B-C trong 3 tháng gần nhất (số lần C lấy từ parseAbcRatings, không so chuỗi):
 *   số C ≥ mustReduceAt (3C) → bắt buộc chọn một kết quả trong `reduceResults`;
 *   số C = capAt (2C)        → kỳ này chỉ được tăng tối đa `maxIncrease` so với kỳ trước (đúng bằng vẫn hợp lệ);
 *   1C                       → không ảnh hưởng.
 * Vi phạm → icon cảnh báo cạnh ô Kỳ này và khóa nút "Xác nhận & gửi". Server cũng phải kiểm tra lại khi nhận đề xuất.
 */
export const ABC_RULES = {
  mustReduceAt: 3,
  capAt: 2,
  maxIncrease: 500_000,
  reduceResults: ['reduce', 'sick', 'cancel', 'suspend'] as readonly ProposalResult[],
} as const;

/** Vòng đời một đề xuất: CQ lập → gửi BLĐ → BLĐ duyệt (hoặc trả lại về `draft`). */
export type ProposalStatus = 'draft' | 'submitted' | 'approved';

/** Các ô được nhập trên mỗi dòng. */
export type EditableField = 'duties' | 'result' | 'next' | 'note' | 'boardDecision';

/**
 * Quyền nhập theo cột, theo vai trò — component chỉ hỏi `canEdit`, không tự đặt điều kiện.
 *   CQ : Công việc & hiệu suất, Kết quả, Kỳ này, Ghi chú — khi đề xuất đang lập.
 *   BLĐ: Quyết định của BLĐ — khi đề xuất đã được gửi.
 *   AD : chỉ xem.
 * TODO: server phải từ chối (403) khi một vai trò ghi vào cột/ở trạng thái không được phép; bảng này chỉ để hiển thị.
 */
export const ROLE_EDIT: Record<AppRole, { status: ProposalStatus | null; fields: readonly EditableField[] }> = {
  CQ: { status: 'draft', fields: ['duties', 'result', 'next', 'note'] },
  BLD: { status: 'submitted', fields: ['boardDecision'] },
  AD: { status: null, fields: [] },
  NV: { status: null, fields: [] },
};

export const canEdit = (role: AppRole, status: ProposalStatus, field: EditableField) =>
  ROLE_EDIT[role].status === status && ROLE_EDIT[role].fields.includes(field);

/** Vai trò đang được thao tác trên đề xuất ở trạng thái này (có nút Lưu nháp / gửi / duyệt). */
export const isEditor = (role: AppRole, status: ProposalStatus) => ROLE_EDIT[role].status === status;
