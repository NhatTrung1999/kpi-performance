import i18n from '@/i18n';

/**
 * Định dạng ngày/số dùng chung — mọi nơi hiển thị phải đi qua đây để đổi theo ngôn ngữ sau này.
 * Locale Intl lấy từ ngôn ngữ đang dùng của i18n.
 */
const INTL_LOCALE: Record<string, string> = { en: 'en-US', vi: 'vi-VN' };
const intlLocale = () => INTL_LOCALE[i18n.language] ?? i18n.language;

type DateInput = string | number | Date;

const toDate = (v: DateInput) => {
  if (v instanceof Date) return v;
  // 'YYYY-MM-DD' không có múi giờ → dựng theo giờ địa phương để không lệch ngày.
  const m = typeof v === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
};

/** Ngày dạng "15 Jan 2015"; `withYear: false` → "15 Jan". */
export const formatDate = (value: DateInput, withYear = true) => {
  const parts = new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(toDate(value));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return [get('day'), get('month'), withYear ? get('year') : ''].filter(Boolean).join(' ');
};

/** Ngày dạng "2015-01-15" (YYYY-MM-DD, theo giờ địa phương) — dùng cho cột ngày trong bảng. */
export const formatIsoDate = (value: DateInput) => {
  const d = toDate(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Ngày dạng "2017/06/02" (YYYY/MM/DD) — quy ước của các bảng nghiệp vụ KPI, không đổi theo ngôn ngữ. */
export const formatSlashDate = (value: DateInput) => formatIsoDate(value).replace(/-/g, '/');

/**
 * Số theo quy ước kế toán của công ty, KHÔNG đổi theo ngôn ngữ: phẩy nhóm hàng nghìn, chấm thập phân ("3,000,000", "9.3").
 * Số âm trong ngoặc đơn: -500000 → "(500,000)". Màu đỏ do nơi hiển thị tự tô.
 */
export const formatAccounting = (value: number, fractionDigits = 0) => {
  const text = new Intl.NumberFormat('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(Math.abs(value));
  return value < 0 ? `(${text})` : text;
};

/** Số tiền: "3,000,000", âm → "(500,000)". */
export const formatMoney = (value: number) => formatAccounting(value);

/** Kỳ theo tháng, vd. ("2026-07", "2026-09") → "07–09/2026"; khác năm → "11/2026–01/2027". */
export const formatMonthRange = (from: string, to: string) => {
  const [fy, fm] = from.split('-');
  const [ty, tm] = to.split('-');
  return fy === ty ? `${fm}–${tm}/${ty}` : `${fm}/${fy}–${tm}/${ty}`;
};

/** Kỳ dạng ngắn, vd. ("2026-10", "2026-12") → "2026.10 ~ 12". */
export const formatPeriodShort = (from: string, to: string) => {
  const [fy, fm] = from.split('-');
  const [ty, tm] = to.split('-');
  return fy === ty ? `${fy}.${fm} ~ ${tm}` : `${fy}.${fm} ~ ${ty}.${tm}`;
};

/** Nhãn kỳ như tiêu đề cột tiền của sheet SUMMARY, vd. ("2026-07", "2026-09") → "2026 07-09"; khác năm → "2026 11-2027 01". */
export const formatPeriodLabel = (from: string, to: string) => {
  const [fy, fm] = from.split('-');
  const [ty, tm] = to.split('-');
  return fy === ty ? `${fy} ${fm}-${tm}` : `${fy} ${fm}-${ty} ${tm}`;
};

/** Tên tháng viết tắt, `month` từ 1 đến 12. */
export const formatMonthShort = (month: number) =>
  new Intl.DateTimeFormat(intlLocale(), { month: 'short' }).format(new Date(2000, month - 1, 1));

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(intlLocale(), options).format(value);

/** `value` tính theo đơn vị phần trăm (8.2 → "8.2%"). */
export const formatPercent = (value: number, fractionDigits = 0) =>
  `${formatNumber(value, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}%`;

/** Giờ theo múi giờ `timeZone`, tách thành phần: { hours: "08", minutes: "42", period: "AM" }. */
export const formatClockParts = (value: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat(intlLocale(), { timeZone, hour: '2-digit', minute: '2-digit', hour12: true }).formatToParts(value);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { hours: get('hour'), minutes: get('minute'), period: get('dayPeriod') };
};

/** Ngày đầy đủ theo múi giờ `timeZone`, vd. "Tuesday, October 13, 2026". */
export const formatLongDate = (value: Date, timeZone: string) =>
  new Intl.DateTimeFormat(intlLocale(), { timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(value);

/** Tháng ISO "YYYY-MM" dạng "MM/YYYY", vd. "2026-10" → "10/2026" (đợt xét Thăng chức & lương). */
export const formatSlashMonth = (month: string) => month.split('-').reverse().join('/');

/** Tháng + năm, vd. "Oct 2026". */
export const formatMonthYear = (value: DateInput) =>
  new Intl.DateTimeFormat(intlLocale(), { month: 'short', year: 'numeric' }).format(toDate(value));

/** Thứ viết tắt, vd. "Thu". */
export const formatWeekdayShort = (value: DateInput) =>
  new Intl.DateTimeFormat(intlLocale(), { weekday: 'short' }).format(toDate(value));

/** Giờ theo giờ địa phương, vd. "10:00 AM". */
export const formatTime = (value: DateInput) =>
  new Intl.DateTimeFormat(intlLocale(), { hour: 'numeric', minute: '2-digit' }).format(toDate(value));
