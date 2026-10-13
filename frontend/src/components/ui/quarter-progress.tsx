import { cn } from "@/lib/utils"
import { InfoCard, type InfoCardProps } from "@/components/ui/info-card"

type QuarterProgressProps = Omit<InfoCardProps, "tone" | "children"> & {
  /** Dòng trạng thái bên trái (vd. "Q4 is in progress"). */
  title: string
  /** Chữ nhấn bên phải (vd. "Week 2 of 13"). */
  caption: string
  /** 0–100. */
  progress: number
  /** Các mốc dưới thanh, trải đều từ trái sang phải. */
  marks?: string[]
}

/** Thẻ tiến độ quý: thanh lấp đầy từ trái sang phải. */
function QuarterProgress({ title, caption, progress, marks, delay = 0, className, ...props }: QuarterProgressProps) {
  const value = Math.min(100, Math.max(0, progress))
  return (
    <InfoCard delay={delay} className={cn("flex flex-col gap-3.5 px-5 py-4", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label text-muted-foreground">{title}</span>
        <span className="text-label font-semibold">{caption}</span>
      </div>
      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="h-2 overflow-hidden rounded-full bg-foreground/[.07]"
      >
        <div
          style={{ width: `${value}%`, animationDelay: `${delay + 200}ms` }}
          className="h-full origin-left animate-fill-in rounded-full bg-gradient-to-r from-brand-from to-brand-to shadow-[0_0_14px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
        />
      </div>
      {marks && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {marks.map((m, i) => <span key={`${i}-${m}`}>{m}</span>)}
        </div>
      )}
    </InfoCard>
  )
}

export { QuarterProgress }
export type { QuarterProgressProps }
