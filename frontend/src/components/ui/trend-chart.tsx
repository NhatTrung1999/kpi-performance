import * as React from "react"
import { cn } from "@/lib/utils"

type TrendPoint = {
  /** Nhãn trục hoành, vd. "Jan". */
  label: string
  value: number
  /** Nội dung tooltip khi rê chuột, vd. "Jan · 58%". */
  tooltip?: string
}

type TrendChartProps = {
  points: TrendPoint[]
  /** Khoảng giá trị của trục tung. */
  min?: number
  max?: number
  /** Các vạch lưới ngang, `label` đã định dạng (vd. "80%"). */
  ticks?: { value: number; label: string }[]
  /** Đường mục tiêu nét đứt. */
  target?: number
  /** Ô chú thích gắn với điểm cuối. */
  callout?: { title?: React.ReactNode; value: React.ReactNode; caption?: React.ReactNode }
  /** Chỉ ghi nhãn trục hoành mỗi `labelEvery` điểm (luôn ghi điểm cuối) — dùng cho màn hình hẹp. */
  labelEvery?: number
  /** Mô tả biểu đồ cho trình đọc màn hình. */
  ariaLabel: string
  className?: string
}

/** Đường cong mượt qua các điểm (Catmull-Rom → Bézier), toạ độ trong hệ 0–100. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return ""
  const f = (n: number) => +n.toFixed(3)
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`
  }
  return d
}

/**
 * Biểu đồ đường xu hướng: vùng tô gradient thương hiệu, lưới ngang, đường mục tiêu nét đứt,
 * điểm cuối có vòng sáng + ô chú thích; rê chuột từng điểm hiện đường dọc và tooltip.
 * Đường được vẽ dần từ trái sang khi xuất hiện (tắt khi giảm chuyển động).
 */
function TrendChart({ points, min = 40, max = 100, ticks = [], target, callout, labelEvery = 1, ariaLabel, className }: TrendChartProps) {
  // id dùng trong url(#…) — bỏ ký tự đặc biệt của useId.
  const gradientId = `trend-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const [hover, setHover] = React.useState(-1)
  const n = points.length
  const yOf = (v: number) => ((max - Math.min(max, Math.max(min, v))) / (max - min)) * 100
  const xs = points.map((_, i) => (n > 1 ? (i / (n - 1)) * 100 : 50))
  const pts = points.map((p, i) => ({ x: xs[i], y: yOf(p.value) }))
  const line = smoothPath(pts)
  const area = n > 0 ? `${line} L${xs[n - 1]} 100 L${xs[0]} 100 Z` : ""
  const step = n > 1 ? 100 / (n - 1) : 100
  const last = pts[n - 1]

  return (
    <div data-slot="trend-chart" role="img" aria-label={ariaLabel} className={cn("relative h-52.5", className)}>
      <div className="absolute top-2.5 right-3 bottom-7 left-10">
        {ticks.map((t) => (
          <React.Fragment key={t.value}>
            <div aria-hidden="true" className="absolute inset-x-0 h-px bg-border/55" style={{ top: `${yOf(t.value)}%` }} />
            <div aria-hidden="true" className="absolute -left-10 w-8 -translate-y-1/2 text-right text-xs leading-none text-placeholder tabular-nums" style={{ top: `${yOf(t.value)}%` }}>
              {t.label}
            </div>
          </React.Fragment>
        ))}
        {target !== undefined && (
          <div aria-hidden="true" className="absolute inset-x-0 border-t-[1.5px] border-dashed border-muted-foreground opacity-55" style={{ top: `${yOf(target)}%` }} />
        )}
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full animate-line-in overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--brand)" stopOpacity=".22" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2.25} strokeLinecap="round" className="stroke-brand" />
        </svg>

        {points.map((p, i) => {
          const isLast = i === n - 1
          const showLabel = isLast || i % labelEvery === 0
          return (
            <React.Fragment key={i}>
              {showLabel && (
                <div
                  aria-hidden="true"
                  className={cn("absolute -bottom-6 -translate-x-1/2 text-xs leading-none", isLast ? "font-semibold text-foreground" : "text-placeholder")}
                  style={{ left: `${xs[i]}%` }}
                >
                  {p.label}
                </div>
              )}
              {!isLast && (
                <div
                  aria-hidden="true"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(-1)}
                  className="absolute inset-y-0 z-2"
                  style={{ left: `${Math.max(0, xs[i] - step / 2)}%`, width: `${i === 0 ? step / 2 : step}%` }}
                />
              )}
              {hover === i && !isLast && (
                <>
                  <div aria-hidden="true" className="pointer-events-none absolute bottom-0 w-px bg-brand/30" style={{ left: `${xs[i]}%`, top: `${pts[i].y}%` }} />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute size-2 -translate-1/2 rounded-full border-2 border-brand bg-card"
                    style={{ left: `${xs[i]}%`, top: `${pts[i].y}%` }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute z-3 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border border-border bg-popover px-2 py-1.25 text-xs font-semibold whitespace-nowrap text-popover-foreground shadow-toast"
                    style={{ left: `${xs[i]}%`, top: `${pts[i].y}%` }}
                  >
                    {p.tooltip ?? p.label}
                  </div>
                </>
              )}
            </React.Fragment>
          )
        })}

        {last && (
          <>
            <div
              aria-hidden="true"
              className="absolute size-3 -translate-1/2 rounded-full border-[2.5px] border-brand bg-card shadow-[0_0_0_5px_color-mix(in_oklab,var(--brand)_18%,transparent)]"
              style={{ left: `${last.x}%`, top: `${last.y}%` }}
            />
            {callout && (
              <div
                aria-hidden="true"
                className="absolute z-3 flex translate-x-[calc(-100%+18px)] -translate-y-[calc(100%+16px)] flex-col gap-0.5 rounded-[10px] border border-border bg-popover px-3 py-2 whitespace-nowrap text-popover-foreground shadow-toast"
                style={{ left: `${last.x}%`, top: `${last.y}%` }}
              >
                {callout.title && <span className="text-xs leading-tight text-muted-foreground">{callout.title}</span>}
                <span className="text-sm leading-tight font-bold">
                  {callout.value} {callout.caption && <span className="text-xs font-medium text-muted-foreground">{callout.caption}</span>}
                </span>
                <span className="absolute right-[13px] -bottom-[5px] size-2 rotate-45 border-r border-b border-border bg-popover" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type SparklineProps = {
  values: number[]
  /** Màu theo token: `success` (mặc định), `brand`, `warning`, `danger`. */
  tone?: "success" | "brand" | "warning" | "danger"
  className?: string
}

const SPARK_TONE = {
  success: { stroke: "stroke-success", fill: "fill-success/12", dot: "bg-success", ring: "shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_22%,transparent)]" },
  brand: { stroke: "stroke-brand", fill: "fill-brand/12", dot: "bg-brand", ring: "shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_22%,transparent)]" },
  warning: { stroke: "stroke-warning", fill: "fill-warning/12", dot: "bg-warning", ring: "shadow-[0_0_0_3px_color-mix(in_oklab,var(--warning)_22%,transparent)]" },
  danger: { stroke: "stroke-danger", fill: "fill-danger/12", dot: "bg-danger", ring: "shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_22%,transparent)]" },
}

/** Đường xu hướng nhỏ (trang trí) trong thẻ số liệu; giá trị tự co giãn theo min/max của dãy. */
function Sparkline({ values, tone = "success", className }: SparklineProps) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  // Chừa 15% phía trên/dưới để đường không chạm mép.
  const pts = values.map((v, i) => ({ x: values.length > 1 ? (i / (values.length - 1)) * 100 : 50, y: 85 - ((v - lo) / span) * 70 }))
  const line = smoothPath(pts)
  const end = pts[pts.length - 1]
  const c = SPARK_TONE[tone]
  return (
    <div data-slot="sparkline" aria-hidden="true" className={cn("relative h-8", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full animate-line-in overflow-visible">
        <path d={`${line} L100 100 L0 100 Z`} className={c.fill} />
        <path d={line} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinecap="round" className={c.stroke} />
      </svg>
      {end && <div className={cn("absolute size-2 -translate-1/2 rounded-full", c.dot, c.ring)} style={{ left: `${end.x}%`, top: `${end.y}%` }} />}
    </div>
  )
}

export { TrendChart, Sparkline }
export type { TrendChartProps, TrendPoint, SparklineProps }
