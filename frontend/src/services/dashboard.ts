/**
 * Dữ liệu trang Overview — hiện là DỮ LIỆU MẪU, chưa gọi API.
 * Khi backend có endpoint (vd. GET /dashboard/overview), thay thân `getOverview` bằng `http.get(...)`
 * và giữ nguyên kiểu `OverviewData`. Tên KPI/sự kiện là dữ liệu hệ thống nên hiển thị nguyên văn.
 * Ngày lưu ISO `YYYY-MM-DD` (giờ: `YYYY-MM-DDTHH:mm`), mọi định dạng hiển thị đi qua lib/format.ts.
 */

export type OverviewKpi = { id: string; name: string; /** % hoàn thành */ progress: number; due: string };

export type OverviewEvent = {
  id: string;
  title: string;
  date: string;
  /** `time` = giờ cụ thể ("10:00"); `allDay` / `endOfDay` = cả ngày / cuối ngày. */
  when: { time: string } | { allDay: true } | { endOfDay: true };
};

export type OverviewActivityKind = 'updated' | 'approved' | 'achieved' | 'comment';

export type OverviewActivity = {
  id: string;
  kind: OverviewActivityKind;
  /** Tên mục tiêu liên quan. */
  goal: string;
  /** Giá trị mới (%), chỉ với `updated`. */
  value?: number;
  /** Thời điểm, ISO datetime. */
  at: string;
};

export type OverviewData = {
  completion: { value: number; target: number };
  goals: { achieved: number; total: number };
  score: { value: number; max: number; reviews: number; self: number; manager: number };
  change: { previous: number; current: number; /** Chuỗi % cho sparkline. */ trend: number[] };
  /** % hoàn thành từng tháng của năm `year`, phần tử 0 = tháng 1. */
  monthly: { year: number; values: number[] };
  kpis: { total: number; items: OverviewKpi[] };
  upcoming: OverviewEvent[];
  activity: OverviewActivity[];
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoDateTime = (d: Date) => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (base: Date, days: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
const at = (base: Date, days: number, h: number, m: number) => {
  const d = addDays(base, days);
  d.setHours(h, m, 0, 0);
  return d;
};

/** Dữ liệu mẫu theo thiết kế; ngày lịch/hoạt động tính tương đối theo hôm nay để luôn "sắp tới". */
function sampleOverview(now: Date): OverviewData {
  return {
    completion: { value: 78, target: 90 },
    goals: { achieved: 5, total: 8 },
    score: { value: 4.3, max: 5, reviews: 6, self: 4.1, manager: 4.5 },
    change: { previous: 72.1, current: 78, trend: [64, 68.5, 70.4, 72.1, 74.6, 78] },
    monthly: { year: 2026, values: [58, 61, 65, 63, 67, 70, 68, 71, 72.1, 78] },
    kpis: {
      total: 8,
      items: [
        { id: 'k1', name: 'New customers acquired', progress: 96, due: '2026-12-15' },
        { id: 'k2', name: 'Defect rate below 1.5%', progress: 92, due: '2026-12-20' },
        { id: 'k3', name: 'Customer satisfaction (CSAT)', progress: 84, due: '2026-11-30' },
        { id: 'k4', name: 'Order processing time', progress: 71, due: '2026-12-10' },
        { id: 'k5', name: 'Training hours completed', progress: 45, due: '2026-12-31' },
      ],
    },
    upcoming: [
      { id: 'e1', title: 'Weekly check-in', date: isoDate(addDays(now, 2)), when: { time: '10:00' } },
      { id: 'e2', title: '1:1 with your manager', date: isoDate(addDays(now, 7)), when: { time: '14:30' } },
      { id: 'e3', title: 'Update monthly KPI results', date: isoDate(addDays(now, 15)), when: { endOfDay: true } },
      { id: 'e4', title: 'Mid-quarter review', date: isoDate(addDays(now, 20)), when: { time: '09:00' } },
      { id: 'e5', title: 'Quarterly self-review opens', date: isoDate(addDays(now, 46)), when: { allDay: true } },
    ],
    activity: [
      { id: 'a1', kind: 'updated', goal: 'Customer satisfaction', value: 84, at: isoDateTime(new Date(now.getTime() - 2 * 3_600_000)) },
      { id: 'a2', kind: 'approved', goal: 'CSAT', at: isoDateTime(at(now, -1, 16, 12)) },
      { id: 'a3', kind: 'achieved', goal: 'Product knowledge test', at: isoDateTime(at(now, -4, 11, 0)) },
      { id: 'a4', kind: 'comment', goal: 'Training hours completed', at: isoDateTime(at(now, -5, 15, 30)) },
    ],
  };
}

const EMPTY: OverviewData = {
  completion: { value: 0, target: 90 },
  goals: { achieved: 0, total: 0 },
  score: { value: 0, max: 5, reviews: 0, self: 0, manager: 0 },
  change: { previous: 0, current: 0, trend: [] },
  monthly: { year: 2026, values: [] },
  kpis: { total: 0, items: [] },
  upcoming: [],
  activity: [],
};

/**
 * Chỉ ở môi trường dev: thêm `?mock=empty` hoặc `?mock=error` vào URL để xem trạng thái trống / lỗi.
 */
const devMockState = () => (import.meta.env.DEV ? new URLSearchParams(window.location.search).get('mock') : null);

export async function getOverview(): Promise<OverviewData> {
  await new Promise((r) => setTimeout(r, 450));
  const state = devMockState();
  if (state === 'error') throw new Error('Mock overview error');
  if (state === 'empty') return EMPTY;
  return sampleOverview(new Date());
}
