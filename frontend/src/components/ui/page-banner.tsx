import * as React from "react"
import { cn } from "@/lib/utils"

type PageBannerBadge = {
  /** Nhãn huy hiệu, vd. "Manager". */
  label: React.ReactNode
  /** Số liệu hiển thị bên phải nhãn. */
  value: React.ReactNode
  /** Đang tải: thay số bằng khung chờ. */
  loading?: boolean
  /** Có `onClick` thì huy hiệu thành nút bấm (vd. lọc bảng bên dưới). */
  onClick?: () => void
  /** Đang bật (chỉ có nghĩa với huy hiệu bấm được): nền trắng đặc, chữ thương hiệu. */
  active?: boolean
  /** Chấm cảnh báo trước nhãn. */
  dot?: boolean
  /** Tooltip / nhãn mô tả hành động của huy hiệu bấm được. */
  title?: string
}

type PageBannerProps = {
  /** Biểu tượng trong ô kính mờ bên trái (vd. icon lucide). */
  icon: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  badges?: PageBannerBadge[]
  /** Nhãn đọc bởi trình đọc màn hình khi `loading`; ứng dụng truyền chuỗi đã dịch. */
  loadingLabel?: string
  className?: string
}

/** Banner tiêu đề trang: nền gradient thương hiệu, gọn một dòng, kèm các huy hiệu thống kê. */
function PageBanner({ icon, title, subtitle, badges, loadingLabel = "Loading", className }: PageBannerProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-17 flex-wrap items-center justify-between gap-x-6 gap-y-3 overflow-hidden rounded-2xl bg-brand-gradient px-5 py-3 text-white shadow-brand",
        className
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 40"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full"
      >
        <path d="M0 22 C120 8 240 34 360 20 S600 6 720 22 S900 34 1000 16" strokeOpacity=".14" />
        <path d="M0 32 C140 18 260 42 400 28 S640 14 780 30 S920 40 1000 26" strokeOpacity=".1" />
        <path d="M0 12 C160 2 300 26 440 14 S700 0 840 14 S940 22 1000 8" strokeOpacity=".07" />
      </svg>
      <div className="relative flex min-w-0 items-center gap-3">
        <div className="flex size-9 flex-none items-center justify-center rounded-[10px] border border-white/20 bg-white/20 [&_svg]:size-[18px]">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col gap-px">
          <h2 className="text-lg leading-6 font-bold tracking-[.03em]">{title}</h2>
          {subtitle && <p className="text-xs leading-4 text-white/80">{subtitle}</p>}
        </div>
      </div>
      {badges && badges.length > 0 && (
        <div className="relative flex flex-wrap items-center gap-2">
          {badges.map((b, i) => {
            const body = (
              <>
                {b.dot && <span aria-hidden="true" className="size-[7px] flex-none rounded-full bg-warning ring-3 ring-warning/25" />}
                {b.label}
                {b.loading ? (
                  <span role="status" aria-label={loadingLabel} className="h-3.5 w-5 animate-pulse rounded bg-white/35" />
                ) : (
                  b.value !== "" && b.value != null && <b className="font-bold tabular-nums">{b.value}</b>
                )}
              </>
            )
            const base = "flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap"
            if (!b.onClick) {
              return (
                <span key={i} className={cn(base, "border-white/30 bg-white/15")}>
                  {body}
                </span>
              )
            }
            return (
              <button
                key={i}
                type="button"
                title={b.title}
                aria-pressed={!!b.active}
                onClick={b.onClick}
                className={cn(
                  base,
                  "cursor-pointer transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                  b.active ? "border-white bg-white font-semibold text-brand-text" : "border-white/30 bg-white/15 hover:border-white/50 hover:bg-white/20"
                )}
              >
                {body}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

export { PageBanner }
export type { PageBannerBadge, PageBannerProps }
