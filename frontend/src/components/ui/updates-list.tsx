import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { InfoCard, type InfoCardProps } from "@/components/ui/info-card"

type UpdateTone = "warning" | "brand" | "info" | "success"

const TONE: Record<UpdateTone, { box: string; tag: string }> = {
  warning: { box: "bg-warning/15 text-warning-text", tag: "text-warning-text" },
  brand: { box: "bg-brand/15 text-brand-text", tag: "text-brand-text" },
  info: { box: "bg-info/15 text-info", tag: "text-info" },
  success: { box: "bg-success/15 text-success-text", tag: "text-success-text" },
}

interface UpdatesListItem {
  id: string
  icon: React.ReactNode
  tone?: UpdateTone
  /** Nhãn loại (vd. "New", "Planned"). */
  tag: string
  title: string
  detail?: string
  /** Ngày đã định dạng. */
  date?: string
  /** Có liên kết thì dòng hiện mũi tên → khi hover. */
  href?: string
  /** Class thêm cho dòng (vd. ẩn bớt dòng khi màn hình thấp). */
  className?: string
}

type UpdatesListProps = Omit<InfoCardProps, "tone" | "title" | "children"> & {
  title: string
  /** Liên kết phụ bên phải tiêu đề (vd. "Release notes"); bỏ trống thì ẩn. */
  action?: { label: string; href: string }
  items: UpdatesListItem[]
}

function Row({ item, index, delay }: { item: UpdatesListItem; index: number; delay: number }) {
  const tone = TONE[item.tone ?? "brand"]
  const Tag = item.href ? "a" : "div"
  return (
    <Tag
      {...(item.href ? { href: item.href } : {})}
      style={{ animationDuration: "300ms", animationDelay: `${delay + index * 60}ms` }}
      className={cn("group/row -mx-2 flex min-h-0 flex-1 animate-card-in items-center gap-3.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-brand/[.06] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none", item.className)}
    >
      <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] [&>svg]:size-[15px]", tone.box)}>
        {item.icon}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-label text-text-secondary">
        <span className={cn("shrink-0 text-[11px] font-semibold", tone.tag)}>{item.tag}</span>
        <b className="truncate font-semibold text-foreground">{item.title}</b>
        {item.detail && <span className="hidden truncate sm:inline">· {item.detail}</span>}
      </span>
      {item.date && <span className="shrink-0 text-xs text-placeholder">{item.date}</span>}
      {item.href && (
        <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 -translate-x-1 text-brand-text opacity-0 transition duration-200 group-hover/row:translate-x-0 group-hover/row:opacity-100" />
      )}
    </Tag>
  )
}

/** Danh sách "What's new": các dòng hiện lần lượt, hover đổi nền và hiện mũi tên. */
function UpdatesList({ title, action, items, delay = 0, className, ...props }: UpdatesListProps) {
  return (
    <InfoCard delay={delay} className={cn("flex flex-col overflow-hidden px-5 py-2", className)} {...props}>
      <div className="flex shrink-0 items-center justify-between py-2.5 text-label text-muted-foreground">
        <span>{title}</span>
        {action && (
          <a href={action.href} className="rounded text-brand-text hover:text-brand-text-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
            {action.label}
          </a>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border">
        {items.map((item, i) => <Row key={item.id} item={item} index={i} delay={delay + 120} />)}
      </div>
    </InfoCard>
  )
}

export { UpdatesList }
export type { UpdatesListItem, UpdatesListProps, UpdateTone }
