import { describe, expect, it } from 'vitest';
import { countGrade, parseAbcRatings } from './abc';

describe('parseAbcRatings', () => {
  it('chuỗi rỗng / null → []', () => {
    expect(parseAbcRatings('')).toEqual([]);
    expect(parseAbcRatings('   ')).toEqual([]);
    expect(parseAbcRatings(null)).toEqual([]);
  });

  it('"3C"', () => {
    expect(parseAbcRatings('3C')).toEqual([{ count: 3, grade: 'C' }]);
  });

  it('"1A, 1B, 1C"', () => {
    expect(parseAbcRatings('1A, 1B, 1C')).toEqual([
      { count: 1, grade: 'A' },
      { count: 1, grade: 'B' },
      { count: 1, grade: 'C' },
    ]);
  });

  it('"2B,1C" (không có khoảng trắng)', () => {
    expect(parseAbcRatings('2B,1C')).toEqual([
      { count: 2, grade: 'B' },
      { count: 1, grade: 'C' },
    ]);
  });

  it('bỏ khoảng trắng thừa và chấp nhận chữ thường', () => {
    expect(parseAbcRatings(' 1 b ,  2c ')).toEqual([
      { count: 1, grade: 'B' },
      { count: 2, grade: 'C' },
    ]);
  });

  it('sai định dạng: bỏ qua phần sai, giữ phần đúng, không ném lỗi', () => {
    expect(parseAbcRatings('1B, xx, 2C')).toEqual([
      { count: 1, grade: 'B' },
      { count: 2, grade: 'C' },
    ]);
    expect(parseAbcRatings('C3, 2D, A, 0C, ,,')).toEqual([]);
    expect(parseAbcRatings('abc')).toEqual([]);
  });
});

describe('countGrade', () => {
  it('cộng số lần của một mức', () => {
    expect(countGrade(parseAbcRatings('1A, 2C'), 'C')).toBe(2);
    expect(countGrade(parseAbcRatings('1A, 2C'), 'B')).toBe(0);
    expect(countGrade([], 'C')).toBe(0);
  });
});
