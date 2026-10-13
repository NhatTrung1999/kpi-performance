import i18n from '@/i18n';

/**
 * Định dạng ngày/số dùng chung — mọi nơi hiển thị phải đi qua đây để đổi theo ngôn ngữ sau này.
 * Locale Intl lấy từ ngôn ngữ đang dùng của i18n.
 */
const INTL_LOCALE: Record<string, string> = { en: 'en-US' };
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
