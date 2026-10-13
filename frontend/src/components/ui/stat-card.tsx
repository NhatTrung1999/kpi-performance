import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { cn } from "@/lib/utils"

type StatTrend = {
  /** Thay đổi theo %, âm = giảm. */
  value: number
  /** Chỉ số mà giảm là tốt (vd. tỷ lệ lỗi): đảo màu tốt/xấu. */
  inverse?: boolean
  /** Mô tả kỳ so sánh, vd. "vs. last quarter". */
  caption?: string
  /** Chữ ẩn cho trình đọc màn hình (mặc định tiếng Anh; ứng dụng truyền chuỗi đã dịch). */
  labels?: { flat: string; up: string; down: string }
}

const DEFAULT_TREND_LABELS = { flat: "No change", up: "Up", down: "Down" }

function TrendIndicator({ value, inverse, caption, labels = DEFAULT_TREND_LABELS }: StatTrend) {
  const flat = value === 0
  const good = inverse ? value < 0 : value > 0
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <p className="flex items-center gap-1 text-label">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          flat ? "text-muted-foreground" : good ? "text-success-text" : "text-danger-text"
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
        <span className="sr-only">{flat ? labels.flat : value > 0 ? labels.up : labels.down}</span>
        {Math.abs(value)}%
      </span>
      {caption && <span className="text-muted-foreground">{caption}</span>}
    </p>
  )
}

/** Thẻ chỉ số: ưu tiên dễ đọc số liệu — nền phẳng, số lớn, không hiệu ứng. */
function StatCard({
  label,
  value,
  unit,
  trend,
  progress,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Card>, "children"> & {
  label: string
  value: React.ReactNode
  unit?: string
  trend?: StatTrend
  /** Phần trăm hoàn thành chỉ tiêu; hiện ProgressBar 3 màu. */
  progress?: number
}) {
  return (
    <Card data-slot="stat-card" className={cn("gap-3 px-(--card-spacing)", className)} {...props}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </p>
      {trend && <TrendIndicator {...trend} />}
      {progress !== undefined && <ProgressBar value={progress} label={label} showValue />}
    </Card>
  )
}

export { StatCard }
export type { StatTrend }
