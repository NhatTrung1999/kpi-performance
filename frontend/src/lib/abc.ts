/**
 * Bình bầu A-B-C trong 3 tháng gần nhất — hệ thống nhân sự trả về dạng chuỗi, vd. "1A, 1B, 1C".
 * Mọi chỗ cần mức đánh giá (chip, quy tắc 3C/2C) đều đọc qua parseAbcRatings, không so chuỗi.
 */

export type AbcGrade = 'A' | 'B' | 'C';
export type AbcRating = { count: number; grade: AbcGrade };

const PART = /^(\d+)([ABC])$/;

/**
 * "1B, 2C" → [{ count: 1, grade: 'B' }, { count: 2, grade: 'C' }].
 * Bỏ mọi khoảng trắng, không phân biệt hoa/thường; chuỗi rỗng → []; phần sai định dạng bị bỏ qua (không ném lỗi).
 */
export function parseAbcRatings(raw: string | null | undefined): AbcRating[] {
  if (!raw) return [];
  return raw
    .replace(/\s+/g, '')
    .toUpperCase()
    .split(',')
    .flatMap((part) => {
      const m = PART.exec(part);
      if (!m) return [];
      const count = Number(m[1]);
      return count > 0 ? [{ count, grade: m[2] as AbcGrade }] : [];
    });
}

/** Tổng số lần của một mức, vd. countGrade(parseAbcRatings("1A, 2C"), 'C') → 2. */
export const countGrade = (ratings: AbcRating[], grade: AbcGrade) =>
  ratings.reduce((sum, r) => (r.grade === grade ? sum + r.count : sum), 0);
