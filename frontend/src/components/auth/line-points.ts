/** Toạ độ (theo viewBox 1440×900) của các điểm dữ liệu nằm trên đường — dùng để đặt KpiPill. */
export const LINE_POINTS = {
  growth: { left: `${(420 / 1440) * 100}%`, top: `${(740 / 900) * 100}%` },
  done: { left: `${(720 / 1440) * 100}%`, top: `${(560 / 900) * 100}%` },
} as const;
