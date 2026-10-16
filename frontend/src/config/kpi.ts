/**
 * Ngưỡng trạng thái KPI theo % hoàn thành — một nơi duy nhất, mọi màu/nhãn trạng thái đều suy ra từ đây.
 *   ≥ good (90%)        → On track (xanh)
 *   warn–good (60–89%)  → At risk (vàng)
 *   < warn (60%)        → Behind (đỏ)
 * Sau này có thể lấy từ cấu hình do admin quản lý.
 */
export const KPI_THRESHOLDS = { good: 90, warn: 60 } as const;

export type KpiTone = 'success' | 'warning' | 'danger';

export function getKpiTone(value: number): KpiTone {
  if (value >= KPI_THRESHOLDS.good) return 'success';
  if (value >= KPI_THRESHOLDS.warn) return 'warning';
  return 'danger';
}
