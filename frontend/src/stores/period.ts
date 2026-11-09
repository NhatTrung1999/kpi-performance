import { create } from 'zustand';

export const PERIODS = ['month', 'quarter', 'year'] as const;
export type Period = (typeof PERIODS)[number];

type PeriodState = {
  period: Period;
  setPeriod: (period: Period) => void;
};

/**
 * Kỳ đang chọn (Tháng/Quý/Năm) ở thanh trên — dùng chung cho mọi chỗ hiển thị PeriodTabs
 * (desktop + mobile) và cho các trang cần lọc dữ liệu theo kỳ (đưa `period` vào queryKey).
 * State giao diện dùng chung → Zustand; dữ liệu từ server → TanStack Query.
 */
export const usePeriodStore = create<PeriodState>()((set) => ({
  period: 'quarter',
  setPeriod: (period) => set({ period }),
}));
