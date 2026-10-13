import * as React from "react"
import { cva } from "class-variance-authority"
import { BadgeCheck, CircleCheck, CircleX, Clock, PencilLine, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

/** Trạng thái KPI / phiếu đánh giá. Luôn có icon + chữ, không chỉ dựa vào màu. Nhãn mặc định là tiếng Anh; ứng dụng truyền `children` đã dịch (i18n). */
const BADGE_STATUS = {
  dat: { label: "On track", icon: CircleCheck },
  "canh-bao": { label: "At risk", icon: TriangleAlert },
  "chua-dat": { label: "Off track", icon: CircleX },
  nhap: { label: "Draft", icon: PencilLine },
  "cho-duyet": { label: "Pending review", icon: Clock },
  "da-duyet": { label: "Approved", icon: BadgeCheck },
} as const

type BadgeStatus = keyof typeof BADGE_STATUS

const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap [&>svg]:size-3.5",
  {
    variants: {
      status: {
        dat: "bg-success-soft text-success-text",
        "canh-bao": "bg-warning-soft text-warning-text",
        "chua-dat": "bg-danger-soft text-danger-text",
        nhap: "bg-muted text-muted-foreground",
        "cho-duyet": "bg-accent text-accent-foreground",
        "da-duyet": "bg-success-soft text-success-text",
      },
    },
    defaultVariants: { status: "nhap" },
  }
)

function Badge({
  status = "nhap",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { status?: BadgeStatus }) {
  const { label, icon: Icon } = BADGE_STATUS[status]
  return (
    <span data-slot="badge" data-status={status} className={cn(badgeVariants({ status }), className)} {...props}>
      <Icon aria-hidden="true" />
      {children ?? label}
    </span>
  )
}

export { Badge, badgeVariants, BADGE_STATUS }
export type { BadgeStatus }
