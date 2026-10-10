import * as React from "react"
import { cn } from "@/lib/utils"

/** Ngưỡng màu: ≥ 90% đạt (xanh), 60–89% cảnh báo (vàng), < 60% chưa đạt (đỏ). */
const KPI_THRESHOLDS = { good: 90, warn: 60 } as const

type KpiTone = "success" | "warning" | "danger"

function getKpiTone(value: number): KpiTone {
  if (value >= KPI_THRESHOLDS.good) return "success"
  if (value >= KPI_THRESHOLDS.warn) return "warning"
  return "danger"
}

const TONE_CLASS: Record<KpiTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

function ProgressBar({
  value,
  label,
  showValue = false,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** Phần trăm hoàn thành. Có thể > 100 (vượt chỉ tiêu); thanh chỉ vẽ tối đa 100%. */
  value: number
  /** Nhãn đọc bởi trình đọc màn hình. */
  label?: string
  showValue?: boolean
}) {
  const tone = getKpiTone(value)
  const width = Math.min(100, Math.max(0, value))
  return (
    <div data-slot="progress-bar" data-tone={tone} className={cn("flex items-center gap-3", className)} {...props}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        aria-valuetext={`${Math.round(value)}%`}
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", TONE_CLASS[tone])}
          style={{ width: `${width}%` }}
        />
      </div>
      {showValue && <span className="w-12 text-right text-sm font-medium tabular-nums">{Math.round(value)}%</span>}
    </div>
  )
}

export { ProgressBar, KPI_THRESHOLDS, getKpiTone }
export type { KpiTone }
