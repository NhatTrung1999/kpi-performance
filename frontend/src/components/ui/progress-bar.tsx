import * as React from "react"
import { KPI_THRESHOLDS, getKpiTone, type KpiTone } from "@/config/kpi"
import { cn } from "@/lib/utils"

/** Ngưỡng màu lấy từ config/kpi.ts: ≥ 90% đạt (xanh), 60–89% cảnh báo (vàng), < 60% chưa đạt (đỏ). */

const TONE_CLASS: Record<KpiTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

function ProgressBar({
  value,
  label,
  showValue = false,
  size = "default",
  animated = false,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** Phần trăm hoàn thành. Có thể > 100 (vượt chỉ tiêu); thanh chỉ vẽ tối đa 100%. */
  value: number
  /** Nhãn đọc bởi trình đọc màn hình. */
  label?: string
  showValue?: boolean
  /** `sm` = thanh mảnh 6px, số 13px đậm (bảng KPI). */
  size?: "default" | "sm"
  /** Thanh chạy từ 0 khi xuất hiện (tắt khi giảm chuyển động). */
  animated?: boolean
}) {
  const tone = getKpiTone(value)
  const width = Math.min(100, Math.max(0, value))
  return (
    <div data-slot="progress-bar" data-tone={tone} className={cn("flex items-center gap-3", size === "sm" && "gap-2.5", className)} style={style} {...props}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        aria-valuetext={`${Math.round(value)}%`}
        className={cn("flex-1 overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1.5" : "h-2")}
      >
        <div
          className={cn(
            "h-full origin-left rounded-full transition-[width] duration-500 motion-reduce:transition-none",
            TONE_CLASS[tone],
            animated && "animate-bar-in"
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      {showValue && (
        <span className={cn("text-right tabular-nums", size === "sm" ? "w-[34px] text-[13px] font-semibold" : "w-12 text-sm font-medium")}>
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}

export { ProgressBar, KPI_THRESHOLDS, getKpiTone }
export type { KpiTone }
