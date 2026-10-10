import * as React from "react"
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const TONES = {
  error: { icon: CircleAlert, role: "alert" as const },
  warning: { icon: TriangleAlert, role: "alert" as const },
  success: { icon: CircleCheck, role: "status" as const },
  info: { icon: Info, role: "status" as const },
}

type FormAlertTone = keyof typeof TONES

const alertVariants = cva("flex rounded-control", {
  variants: {
    tone: {
      error: "border-danger-border bg-danger-soft",
      warning: "border-warning/25 bg-warning-soft",
      success: "border-success/20 bg-success-soft",
      info: "border-brand/20 bg-accent",
    },
    layout: {
      /** Có tiêu đề: icon trong ô vuông + tiêu đề + mô tả. */
      rich: "gap-3 border p-4",
      /** Một dòng: icon + nội dung. */
      inline: "items-center gap-2.5 px-4 py-3.5 text-label font-medium",
    },
  },
})

const iconBoxTone: Record<FormAlertTone, string> = {
  error: "bg-danger-border text-danger-text dark:bg-danger-text/15",
  warning: "bg-warning/15 text-warning-text",
  success: "bg-success/15 text-success-text",
  info: "bg-brand/15 text-brand-text",
}

const textTone: Record<FormAlertTone, string> = {
  error: "text-danger-strong",
  warning: "text-warning-text",
  success: "text-success-text",
  info: "text-brand-text",
}

/** Khung thông báo trong form (khác Toast: nằm trong luồng trang, không tự biến mất). */
function FormAlert({
  tone = "error",
  title,
  icon,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  tone?: FormAlertTone
  title?: React.ReactNode
  /** Thay icon mặc định của `tone`. */
  icon?: React.ReactNode
}) {
  const { icon: DefaultIcon, role } = TONES[tone]
  const glyph = icon ?? <DefaultIcon aria-hidden="true" />
  if (title) {
    return (
      <div role={role} data-slot="form-alert" data-tone={tone} className={cn(alertVariants({ tone, layout: "rich" }), className)} {...props}>
        <div className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] [&>svg]:size-4", iconBoxTone[tone])}>{glyph}</div>
        <div className="flex flex-col gap-1">
          <strong className={cn("text-sm font-semibold", textTone[tone])}>{title}</strong>
          <span className="text-label leading-relaxed text-text-secondary">{children}</span>
        </div>
      </div>
    )
  }
  return (
    <div role={role} data-slot="form-alert" data-tone={tone} className={cn(alertVariants({ tone, layout: "inline" }), textTone[tone], className)} {...props}>
      <span className="shrink-0 [&>svg]:size-[18px]">{glyph}</span>
      {children}
    </div>
  )
}

export { FormAlert }
export type { FormAlertTone }
