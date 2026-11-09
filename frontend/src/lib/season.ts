import { useSyncExternalStore } from "react";

/**
 * Trang trí theo dịp lễ ở trang đăng nhập: Tết và Giáng sinh. Tự bật theo lịch, người dùng tắt/bật được (nhớ theo máy,
 * localStorage). Xem trước ngoài mùa: thêm `?season=tet` hoặc `?season=xmas` vào địa chỉ (`?season=off` để ẩn).
 */
export type Season = "tet" | "xmas";

const KEY = "kpi-season-off";

/** Mùng 1 Tết Âm lịch theo năm dương lịch + tên năm (can chi) 3 thứ tiếng. */
const TET: Record<number, { date: string; vi: string; zh: string; en: string }> = {
  2026: { date: "2026-02-17", vi: "Bính Ngọ", zh: "丙午年", en: "Year of the Horse" },
  2027: { date: "2027-02-06", vi: "Đinh Mùi", zh: "丁未年", en: "Year of the Goat" },
  2028: { date: "2028-01-26", vi: "Mậu Thân", zh: "戊申年", en: "Year of the Monkey" },
  2029: { date: "2029-02-13", vi: "Kỷ Dậu", zh: "己酉年", en: "Year of the Rooster" },
  2030: { date: "2030-02-03", vi: "Canh Tuất", zh: "庚戌年", en: "Year of the Dog" },
};

const DAY = 86_400_000;
/** Tết: bật từ 21 ngày trước mùng 1 tới hết 10 ngày sau. */
const TET_BEFORE = 21;
const TET_AFTER = 10;
/** Giáng sinh: 1/12 – hết 26/12 hằng năm. */
const XMAS_FROM = 1;
const XMAS_TO = 26;

export type TetInfo = (typeof TET)[number] & { year: number };
export type ActiveSeason = { season: "tet"; year: number; tet: TetInfo } | { season: "xmas"; year: number };

const tetDay = (year: number) => new Date(`${TET[year].date}T00:00:00+07:00`).getTime();

/** Tết đang trong mùa trang trí (theo `now`); khi xem trước ngoài mùa thì lấy Tết sắp tới. */
export function tetInfo(now = new Date(), preview = false): TetInfo | null {
  const years = Object.keys(TET).map(Number);
  const t = now.getTime();
  const current = years.find((y) => t >= tetDay(y) - TET_BEFORE * DAY && t < tetDay(y) + (TET_AFTER + 1) * DAY);
  if (current) return { year: current, ...TET[current] };
  if (!preview) return null;
  const next = years.find((y) => tetDay(y) > t) ?? years[years.length - 1];
  return { year: next, ...TET[next] };
}

/** Ngày/tháng theo giờ Việt Nam (trang đăng nhập hiển thị giờ TP. HCM). */
function vnDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const isXmas = (now: Date) => {
  const { month, day } = vnDate(now);
  return month === 12 && day >= XMAS_FROM && day <= XMAS_TO;
};

const previewParam = () => new URLSearchParams(window.location.search).get("season");

/** Dịp lễ đang áp dụng (theo lịch hoặc `?season=`), chưa tính việc người dùng tắt. */
export function activeSeason(now = new Date()): ActiveSeason | null {
  const p = previewParam();
  if (p === "off") return null;
  if (p === "xmas" || (p !== "tet" && isXmas(now))) return { season: "xmas", year: vnDate(now).year };
  const tet = tetInfo(now, p === "tet");
  return tet ? { season: "tet", year: tet.year, tet } : null;
}

const listeners = new Set<() => void>();
const readOff = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export function setSeasonOff(off: boolean) {
  try {
    if (off) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // Không lưu được: chỉ có tác dụng tới khi tải lại trang.
  }
  listeners.forEach((l) => l());
}

/** Người dùng đã tắt trang trí lễ chưa. */
export const useSeasonOff = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readOff,
    () => false
  );
