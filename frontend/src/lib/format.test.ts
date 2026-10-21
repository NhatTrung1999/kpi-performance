import { describe, expect, it, vi } from 'vitest';
import { formatPeriodLabel } from './format';

// format.ts đọc ngôn ngữ từ i18n (khởi tạo cần `document`); test chạy trong Node nên thay bằng bản tối thiểu.
vi.mock('@/i18n', () => ({ default: { language: 'vi' } }));

describe('formatPeriodLabel — nhãn cột tiền của sheet SUMMARY', () => {
  it('cùng năm → "2026 07-09"', () => {
    expect(formatPeriodLabel('2026-07', '2026-09')).toBe('2026 07-09');
    expect(formatPeriodLabel('2026-10', '2026-12')).toBe('2026 10-12');
  });

  it('khác năm → ghi cả hai năm', () => {
    expect(formatPeriodLabel('2026-11', '2027-01')).toBe('2026 11-2027 01');
  });
});
