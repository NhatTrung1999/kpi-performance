import { cn } from "@/lib/utils"
import { InfoCard, type InfoCardProps } from "@/components/ui/info-card"

type ClockCardProps = Omit<InfoCardProps, "tone" | "children"> & {
  /** Nhãn nhỏ phía trên (vd. "Local time · Ho Chi Minh City"). */
  label?: string
  hours: string
  minutes: string
  /** AM/PM nếu dùng 12 giờ. */
  period?: string
  /** Ngày đã định dạng. */
  date?: string
}

/** Một chữ số: đổi giá trị thì key đổi → phần tử mới trượt từ dưới lên. */
function Digit({ value }: { value: string }) {
  return <span className="inline-block animate-digit-in">{value}</span>
}

/** Thẻ đồng hồ: nhận giờ đã định dạng (không tự lấy giờ, không chứa chữ cố định) nên dùng lại được. */
function ClockCard({ label, hours, minutes, period, date, className, ...props }: ClockCardProps) {
  return (
    <InfoCard className={cn("flex flex-col justify-between gap-3 px-6 py-5", className)} {...props}>
      {label && <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>}
      <div className="flex items-baseline gap-2">
        <span className="sr-only">{`${hours}:${minutes} ${period ?? ""}`}</span>
        <span aria-hidden="true" className="inline-flex text-5xl leading-none font-semibold tracking-[-0.05em] tabular-nums xl:text-6xl">
          {[...hours].map((c, i) => <Digit key={`h${i}-${c}`} value={c} />)}
          <span className="animate-colon">:</span>
          {[...minutes].map((c, i) => <Digit key={`m${i}-${c}`} value={c} />)}
        </span>
        {period && <span aria-hidden="true" className="text-body text-muted-foreground">{period}</span>}
      </div>
      {date && <div className="text-label text-text-secondary">{date}</div>}
    </InfoCard>
  )
}

export { ClockCard }
export type { ClockCardProps }
