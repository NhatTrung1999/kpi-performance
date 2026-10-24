import { create } from 'zustand';

type PagePeriodState = {
  /** Nhãn kỳ do trang đang mở tự đặt (vd. "Đợt 10/2026"); `null` = trang chưa có dữ liệu. */
  label: string | null;
  setLabel: (label: string | null) => void;
};

/**
 * Nhãn kỳ trên thanh trên cho các trang có kỳ riêng (`ROUTE_META` `period: 'page'`), thay cho quý hiện tại.
 * Trang đặt nhãn khi có dữ liệu kỳ và xóa khi rời trang.
 */
export const usePagePeriodStore = create<PagePeriodState>()((set) => ({
  label: null,
  setLabel: (label) => set({ label }),
}));
