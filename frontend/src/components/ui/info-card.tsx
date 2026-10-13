import * as React from "react"
import { cn } from "@/lib/utils"

type InfoCardProps = React.ComponentProps<"div"> & {
  /** Độ trễ (ms) của hiệu ứng hiện lần lượt khi tải trang. */
  delay?: number
  /** Tông nhấn: `brand` = nền gradient thương hiệu (thẻ đếm ngược). */
  tone?: "default" | "brand"
}

/** Khung thẻ thông tin của trang công khai: hiện lần lượt (fade + nhích lên), nâng nhẹ và sáng viền khi hover. */
function InfoCard({ delay = 0, tone = "default", className, style, ...props }: InfoCardProps) {
  return (
    <div
      data-slot="info-card"
      style={{ animationDelay: `${delay}ms`, ...style }}
      className={cn(
        "animate-card-in rounded-xl border transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5",
        tone === "brand"
          ? "border-brand/30 bg-gradient-to-br from-brand/15 to-brand/[.04] hover:border-brand/60"
          : "border-border bg-card/60 hover:border-border-strong",
        className
      )}
      {...props}
    />
  )
}

export { InfoCard }
export type { InfoCardProps }
