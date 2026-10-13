/** Số tuần chuẩn của một quý (hiển thị "Week x of 13"). */
export const WEEKS_IN_QUARTER = 13;

const DAY_MS = 86_400_000;

export interface QuarterInfo {
  /** 1–4 */
  quarter: number;
  /** Ngày đầu / cuối quý, ISO `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  /** Tháng (1–12) của ba tháng trong quý. */
  months: [number, number, number];
  /** Số ngày còn lại sau hôm nay (hôm nay không tính). */
  daysLeft: number;
  /** Tuần hiện tại, 1–13 (mỗi tuần 7 ngày kể từ đầu quý). */
  week: number;
  /** Phần trăm quý đã trôi qua tính cả hôm nay, 0–100. */
  progress: number;
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Ngày hiện tại (y/m/d) theo múi giờ chỉ định, không phụ thuộc múi giờ của trình duyệt. */
function zonedYmd(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', numberingSystem: 'latn' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Thông tin quý của `now` theo múi giờ `timeZone` (mặc định Asia/Ho_Chi_Minh). */
export function getQuarterInfo(now: Date, timeZone = 'Asia/Ho_Chi_Minh'): QuarterInfo {
  const { year, month, day } = zonedYmd(now, timeZone);
  const quarter = Math.floor((month - 1) / 3) + 1;
  const firstMonth = (quarter - 1) * 3; // 0-based
  const start = Date.UTC(year, firstMonth, 1);
  const endExclusive = Date.UTC(year, firstMonth + 3, 1);
  const today = Date.UTC(year, month - 1, day);

  const totalDays = Math.round((endExclusive - start) / DAY_MS);
  const dayIndex = Math.round((today - start) / DAY_MS); // 0 = ngày đầu quý

  return {
    quarter,
    startDate: iso(start),
    endDate: iso(endExclusive - DAY_MS),
    months: [firstMonth + 1, firstMonth + 2, firstMonth + 3],
    daysLeft: totalDays - dayIndex - 1,
    week: Math.min(WEEKS_IN_QUARTER, Math.floor(dayIndex / 7) + 1),
    progress: ((dayIndex + 1) / totalDays) * 100,
  };
}
