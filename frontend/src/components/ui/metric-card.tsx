import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Nhãn nhỏ chữ hoa, giãn chữ — tiêu đề phụ của thẻ ("COMPLETION", "MY KPIS"…). */
function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("text-[11px] leading-none font-semibold tracking-[.08em] text-muted-foreground uppercase", className)} {...props} />
}

/** Chip tròn nhỏ cạnh tiêu đề thẻ, vd. "Q4", "6 reviews", "Improving". */
function Pill({ tone = "neutral", className, ...props }: React.ComponentProps<"span"> & { tone?: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  return (
    <span
      data-slot="pill"
      className={cn(
        "inline-flex h-5.5 flex-none items-center gap-1 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap tabular-nums [&>svg]:size-2.5",
        tone === "neutral" && "bg-muted text-text-secondary",
        tone === "success" && "bg-success-soft text-success-text",
        tone === "warning" && "bg-warning-soft text-warning-text",
        tone === "danger" && "bg-danger-soft text-danger-text",
        tone === "brand" && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

type MetricCardProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** Chip bên phải tiêu đề (Pill). */
  tag?: React.ReactNode
  /** Số chính (36px). */
  value: React.ReactNode
  /** Đơn vị / mô tả ngắn cạnh số, vd. "% of Q4 target". */
  unit?: React.ReactNode
  /** Dòng phụ dưới số. */
  caption?: React.ReactNode
  /** Phần đáy thẻ (thanh tiến độ, sparkline…), cao 32px, căn đáy. */
  footer?: React.ReactNode
}

/** Thẻ số liệu của trang Overview: tiêu đề + chip, số lớn + đơn vị, phần đáy trực quan. */
function MetricCard({ label, tag, value, unit, caption, footer, className, ...props }: MetricCardProps) {
  return (
    <Card variant="raised" data-slot="metric-card" className={cn("gap-3.5 px-5 py-5", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        {tag}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl leading-none font-bold tracking-[-0.03em] tabular-nums">{value}</span>
          {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
        </div>
        {caption && <span className="text-xs leading-none text-muted-foreground">{caption}</span>}
      </div>
      {footer && <div className="mt-auto flex h-8 flex-col justify-end gap-2">{footer}</div>}
    </Card>
  )
}

export { MetricCard, Eyebrow, Pill }
export type { MetricCardProps }
