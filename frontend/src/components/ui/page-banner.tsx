import * as React from "react"
import { cn } from "@/lib/utils"

type PageBannerProps = {
  /** Biểu tượng trong ô kính mờ bên trái (vd. icon lucide). */
  icon: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Huy hiệu thống kê bên phải banner. */
  badges?: {
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
  }[]
  /** Nhãn đọc bởi trình đọc màn hình khi `loading`; ứng dụng truyền chuỗi đã dịch. */
  loadingLabel?: string
  /** Gọn (trang bảng vừa khít màn hình): bỏ chiều cao tối thiểu, phụ đề nằm cùng dòng tiêu đề. */
  compact?: boolean
  className?: string
}

type PageBannerBadge = NonNullable<PageBannerProps["badges"]>[number]

/** Đường sóng lặp chu kỳ 500 trên khung 2000 (đủ 2 lần độ rộng hiển thị). */
const wave = (y: number, amp: number) => `M0 ${y} Q125 ${y - amp} 250 ${y} T500 ${y} T750 ${y} T1000 ${y} T1250 ${y} T1500 ${y} T1750 ${y} T2000 ${y}`
const WAVES = [
  { d: wave(22, 12), opacity: 0.14, duration: "28s", reverse: false },
  { d: wave(30, 10), opacity: 0.1, duration: "38s", reverse: true },
  { d: wave(13, 8), opacity: 0.07, duration: "48s", reverse: false },
]

/** Banner tiêu đề trang: nền gradient thương hiệu, gọn một dòng, kèm các huy hiệu thống kê. */
function PageBanner({ icon, title, subtitle, badges, loadingLabel = "Loading", compact = false, className }: PageBannerProps) {
  return (
    <section
      className={cn(
        "relative flex flex-none animate-banner-enter flex-wrap items-center justify-between gap-x-6 overflow-hidden rounded-2xl bg-brand-gradient px-5 py-3 text-white shadow-brand",
        compact ? "gap-y-2" : "min-h-17 gap-y-3",
        className
      )}
    >
      {/* Sóng: mỗi đường là một SVG rộng 200% lặp đúng 2 chu kỳ sóng (Q/T chu kỳ 500) → trượt -50% là liền mạch.
          Ba đường trôi với tốc độ khác nhau để không đều tăm tắp. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
        {WAVES.map((w) => (
          <svg
            key={w.d}
            viewBox="0 0 2000 40"
            preserveAspectRatio="none"
            fill="none"
            stroke="currentColor"
            className="absolute inset-y-0 left-0 h-full w-[200%] animate-banner-wave"
            style={{ animationDuration: w.duration, animationDirection: w.reverse ? "reverse" : undefined }}
          >
            <path d={w.d} strokeOpacity={w.opacity} />
          </svg>
        ))}
      </div>
      {/* Vệt sáng lướt qua một lần khi trang mở. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-banner-shine bg-[linear-gradient(105deg,transparent_35%,rgb(255_255_255/0.22)_50%,transparent_65%)]"
      />
      <div className="relative flex min-w-0 items-center gap-3">
        <div className={cn("flex flex-none items-center justify-center rounded-[10px] border border-white/20 bg-white/20", compact ? "size-8 [&_svg]:size-4" : "size-9 [&_svg]:size-[18px]")}>
          {icon}
        </div>
        <div className={cn("flex min-w-0", compact ? "flex-wrap items-baseline gap-x-3 gap-y-px" : "flex-col gap-px")}>
          <h2 className={cn("font-bold tracking-[.03em]", compact ? "text-base leading-6" : "text-lg leading-6")}>{title}</h2>
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
            // Huy hiệu hiện lần lượt sau băng tiêu đề.
            const base = "flex h-7 animate-banner-enter items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap"
            const enter = { animationDelay: `${120 + i * 70}ms` }
            if (!b.onClick) {
              return (
                <span key={i} style={enter} className={cn(base, "border-white/30 bg-white/15")}>
                  {body}
                </span>
              )
            }
            return (
              <button
                key={i}
                style={enter}
                type="button"
                title={b.title}
                aria-pressed={!!b.active}
                onClick={b.onClick}
                className={cn(
                  base,
                  "cursor-pointer transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                  // Nền trắng cố định → chữ xanh đậm cố định (text-brand-text đổi sang xanh nhạt trong vùng tông tối, mất chữ).
                  b.active ? "border-white bg-white font-semibold text-indigo-700" : "border-white/30 bg-white/15 hover:border-white/50 hover:bg-white/20"
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
