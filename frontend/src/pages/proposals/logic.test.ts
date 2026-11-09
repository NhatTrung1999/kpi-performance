import { describe, expect, it } from 'vitest';
import { isListed, SAMPLE_ROWS } from '@/services/kpiProposal';
import { diffOf, summarize, validateRow } from './logic';

describe('summarize — đúng bộ dữ liệu mẫu 10 nhân viên', () => {
  const rows = SAMPLE_ROWS.filter(isListed);

  it('bỏ người đã thôi việc, còn đúng 10 dòng', () => {
    expect(rows).toHaveLength(10);
  });

  it('11,000,000 → 8,000,000, chênh lệch (3,000,000)', () => {
    expect(summarize(rows)).toEqual({ count: 10, prev: 11_000_000, next: 8_000_000, diff: -3_000_000 });
  });

  it('tổng chênh lệch = tổng chênh lệch từng dòng', () => {
    expect(rows.reduce((s, r) => s + diffOf(r), 0)).toBe(-3_000_000);
  });

  // Lỗi 1 của file Excel (sheet SUMMARY): ô tổng dùng SUM(M4:M11) — chỉ 8 dòng đầu — nên ra 10,500,000 → 6,500,000.
  it('tổng cộng đủ 10 dòng, không phải chỉ 8 dòng đầu như SUM(M4:M11) của file gốc', () => {
    const excelBug = summarize(rows.slice(0, 8));
    expect(excelBug).toMatchObject({ prev: 10_500_000, next: 6_500_000 });
    expect(summarize(rows)).not.toMatchObject({ prev: excelBug.prev, next: excelBug.next });
  });

  // Lỗi 2 của file Excel: ô O9 (Diff của PLDM) để trống, thiếu công thức.
  it('PLDM có Diff 500,000', () => {
    const pldm = rows.find((r) => r.name === 'PLDM');
    expect(pldm && diffOf(pldm)).toBe(500_000);
  });

  it('Diff = kỳ này − kỳ trước cho MỌI dòng', () => {
    expect(rows.map((r) => [r.name, diffOf(r)])).toEqual([
      ['XXXX', -3_000_000],
      ['XYZA', -500_000],
      ['ABCD', -1_000_000],
      ['HGTF', 0],
      ['ASPD', 0],
      ['PLDM', 500_000],
      ['KMND', -500_000],
      ['BHTC', 500_000],
      ['AFTT', 500_000],
      ['HTTK', 500_000],
    ]);
  });

  it('HTTK là nhân viên mới, có ghi chú "New employee"', () => {
    expect(rows.find((r) => r.name === 'HTTK')).toMatchObject({ result: 'add', prev: 0, next: 500_000, note: 'New employee' });
  });

  it('kỳ này chưa nhập tính là 0', () => {
    expect(summarize([{ prev: 500_000, next: null }])).toEqual({ count: 1, prev: 500_000, next: 0, diff: -500_000 });
  });
});

describe('validateRow — quy tắc ABC', () => {
  it('3C nhưng không chọn kết quả giảm → vi phạm', () => {
    expect(validateRow({ abc: '3C', result: 'maintain', prev: 1_000_000, next: 1_000_000 })).toBe('mustReduce');
    expect(validateRow({ abc: '3C', result: 'increase', prev: 1_000_000, next: 1_200_000 })).toBe('mustReduce');
  });

  it('3C và chọn kết quả giảm → hợp lệ', () => {
    expect(validateRow({ abc: '3C', result: 'reduce', prev: 1_000_000, next: 500_000 })).toBeNull();
  });

  it('2C tăng đúng 500,000 → hợp lệ', () => {
    expect(validateRow({ abc: '1A, 2C', result: 'increase', prev: 500_000, next: 1_000_000 })).toBeNull();
  });

  it('2C tăng 500,001 → vi phạm', () => {
    expect(validateRow({ abc: '1A, 2C', result: 'increase', prev: 500_000, next: 1_000_001 })).toBe('capIncrease');
  });

  it('1C tăng bất kỳ → hợp lệ', () => {
    expect(validateRow({ abc: '1A, 1B, 1C', result: 'increase', prev: 500_000, next: 5_000_000 })).toBeNull();
    expect(validateRow({ abc: '2B,1C', result: 'add', prev: 0, next: 9_999_999 })).toBeNull();
  });

  it('chuỗi bình bầu sai định dạng không làm vỡ kiểm tra', () => {
    expect(validateRow({ abc: 'xx, 3', result: 'increase', prev: 0, next: 1_000_000 })).toBeNull();
  });
});
