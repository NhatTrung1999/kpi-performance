import * as React from "react"
import { cn } from "@/lib/utils"
import { useCountUp } from "@/hooks/use-count-up"
import { InfoCard, type InfoCardProps } from "@/components/ui/info-card"

type CountdownCardProps = Omit<InfoCardProps, "tone" | "children"> & {
  /** Nhãn nhỏ phía trên (vd. "Quarter countdown"). */
  label?: string
  /** Số ngày còn lại — đếm tăng từ 0 khi hiện. */
  days: number
  /** Chữ đi kèm số (vd. "days left in Q4"). */
  daysLabel: string
  /** Tổng số ô tuần. */
  weeks?: number
  /** Số ô tuần đã tô (tính cả tuần hiện tại). */
  filledWeeks?: number
  /** Bản nhỏ một dòng cho mobile (không có nhãn và ô tuần). */
  compact?: boolean
  /** Nội dung bên phải ở bản compact (vd. giờ hiện tại). */
  trailing?: React.ReactNode
}

/** Thẻ đếm ngược quý: số đếm tăng, ô tuần lấp dần và có vệt sáng quét định kỳ. */
function CountdownCard({ label, days, daysLabel, weeks = 13, filledWeeks = 0, compact, trailing, delay = 0, className, ...props }: CountdownCardProps) {
  const shown = useCountUp(days, 600, delay + 150)

  if (compact) {
    return (
      <InfoCard tone="brand" delay={delay} className={cn("flex items-center justify-between gap-3 px-4 py-3", className)} {...props}>
        <div className="flex items-baseline gap-2">
          <span className="sr-only">{days}</span>
          <span aria-hidden="true" className="text-2xl font-semibold tracking-[-0.04em] tabular-nums">{shown}</span>
          <span className="text-xs text-brand-text">{daysLabel}</span>
        </div>
        {trailing && <span className="text-xs text-muted-foreground tabular-nums">{trailing}</span>}
      </InfoCard>
    )
  }

  return (
    <InfoCard tone="brand" delay={delay} className={cn("flex flex-col justify-between gap-3 px-6 py-5", className)} {...props}>
      {label && <div className="text-xs tracking-wide text-brand-text uppercase">{label}</div>}
      <div className="flex items-baseline gap-2.5">
        <span className="sr-only">{days}</span>
        <span aria-hidden="true" className="text-5xl leading-none font-semibold tracking-[-0.05em] tabular-nums xl:text-6xl">{shown}</span>
        <span className="text-body text-brand-text">{daysLabel}</span>
      </div>
      <div aria-hidden="true" className="relative flex gap-[3px] overflow-hidden rounded-sm">
        {Array.from({ length: weeks }, (_, i) =>
          i < filledWeeks ? (
            <div key={i} style={{ animationDelay: `${delay + 300 + i * 60}ms` }} className="h-1.5 flex-1 origin-left animate-tick-in rounded-xs bg-brand" />
          ) : (
            <div key={i} className="h-1.5 flex-1 rounded-xs bg-foreground/10" />
          ),
        )}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    </InfoCard>
  )
}

export { CountdownCard }
export type { CountdownCardProps }
