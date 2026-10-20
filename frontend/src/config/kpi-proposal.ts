/**
 * Cấu hình nghiệp vụ trang Đề xuất KPI — một nơi duy nhất, trang và kiểm tra đều đọc từ đây.
 * Sau này có thể lấy từ cấu hình do admin quản lý (kỳ đánh giá).
 */

/** Kết quả đánh giá (thiết lập sẵn & cho chọn). Thứ tự = thứ tự trong danh sách chọn. */
export const PROPOSAL_RESULTS = ['suspend', 'sick', 'cancel', 'maintain', 'increase', 'reduce', 'add'] as const;
export type ProposalResult = (typeof PROPOSAL_RESULTS)[number];

/** Màu chữ theo kết quả: giảm/hủy đỏ, tăng/thêm mới xanh dương, còn lại (giữ nguyên, tạm hoãn) chữ thường. */
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
 * Quy tắc bình bầu A-B-C trong 3 tháng gần nhất:
 *   số C ≥ mustReduceAt (3C) → bắt buộc chọn một kết quả trong `reduceResults`;
 *   số C = capAt (2C)        → kỳ này chỉ được tăng tối đa `maxIncrease` so với kỳ trước;
 *   1C                       → không ảnh hưởng.
 * Vi phạm → cảnh báo trên dòng và khóa nút "Xác nhận & gửi". Server cũng phải kiểm tra lại khi nhận đề xuất.
 */
export const ABC_RULES = {
  mustReduceAt: 3,
  capAt: 2,
  maxIncrease: 500_000,
  reduceResults: ['reduce', 'sick', 'cancel', 'suspend'] as readonly ProposalResult[],
} as const;
