import * as React from "react"
import { cn } from "@/lib/utils"
import { InfoCard, type InfoCardProps } from "@/components/ui/info-card"

type AnnouncementCardProps = Omit<InfoCardProps, "tone" | "title" | "children"> & {
  /** Icon trong ô vuông bên trái. */
  icon?: React.ReactNode
  /** Nhãn nhỏ trước tiêu đề (vd. "From HR"). */
  badge?: string
  title: string
  description?: string
  /** Chữ nhỏ bên phải (vd. "Pinned"). */
  aside?: string
}

/** Thẻ thông báo (vd. của HR). Chỉ nhận chữ đã sẵn sàng hiển thị — không tự dịch. */
function AnnouncementCard({ icon, badge, title, description, aside, delay = 0, className, ...props }: AnnouncementCardProps) {
  return (
    <InfoCard delay={delay} className={cn("flex items-center gap-4 px-5 py-4", className)} {...props}>
      {icon && (
        <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning-text [&>svg]:size-[18px]">
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary">{badge}</span>}
          <span className="text-body font-semibold">{title}</span>
        </div>
        {description && <p className="text-label text-muted-foreground">{description}</p>}
      </div>
      {aside && <span className="shrink-0 text-xs text-placeholder">{aside}</span>}
    </InfoCard>
  )
}

export { AnnouncementCard }
export type { AnnouncementCardProps }
