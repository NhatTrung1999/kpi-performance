import * as React from "react"
import { cn } from "@/lib/utils"

/*
 * Bố cục dùng chung cho trang dạng bảng.
 * - Từ lg: MainLayout cao đúng màn hình, PageShell giãn hết chỗ còn lại, TableCard lấp phần dư
 *   và chỉ TableCardBody cuộn (một vùng cuộn duy nhất).
 * - Dưới lg: cuộn cả trang, TableCardBody có chiều cao tối đa và cuộn ngang/dọc trong khung riêng.
 * - `fit` (bảng nghiệp vụ rộng, vd. Đề xuất KPI, Thăng chức & lương): trang vừa khít màn hình, không cuộn ngoài;
 *   TableCard cao vừa đủ số dòng (ít dòng thì thấp lại, không chừa khoảng trống), tối đa bằng phần còn lại của màn hình,
 *   nên thanh cuộn ngang nằm sát dưới dòng cuối; không thấp hơn đầu bảng + `minRows` dòng. Các khối khác `flex-none`,
 *   hoặc co được (có `min-h-*`, vd. dải ghi chú) để nhường chỗ khi màn hình thấp — chúng chỉ co sau khi bảng đã chạm mức tối thiểu.
 */

/** Thẻ `main` của trang: các khối phía trên (banner, bộ lọc) tự nhiên, TableCard chiếm phần còn lại. */
function PageShell({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="page-shell"
      className={cn("flex min-w-0 flex-col gap-4 px-4 py-6 lg:min-h-0 lg:flex-1 lg:px-8", className)}
      {...props}
    />
  )
}

/**
 * Chiều cao tối thiểu của TableCard `fit` để vẫn thấy `rows` dòng đầu của DataGrid: đầu bảng + `rows` dòng + dòng tổng
 * + thanh cuộn ngang + phần còn lại của card (viền, chú thích). Bảng ít dòng hơn thì bằng đúng chiều cao nội dung.
 * Chưa có DataGrid (đang tải, lỗi) → 0.
 */
function fitMinHeight(card: HTMLElement, rows: number) {
  const grid = card.querySelector<HTMLElement>('[data-slot="data-grid"]')
  const body = grid?.parentElement
  if (!grid || !body) return 0
  const bodyRows = grid.querySelectorAll(':scope > [data-slot="data-grid-row"]')
  const footer = grid.querySelector(':scope > [data-slot="data-grid-footer"] > [role="cell"]')
  // Dòng là `display: contents` → đo ô đầu của dòng thứ `rows`; không có dòng thì lấy hết nội dung (dòng trống).
  const last = bodyRows[Math.min(rows, bodyRows.length) - 1]?.firstElementChild
  const content = last ? last.getBoundingClientRect().bottom - grid.getBoundingClientRect().top + (footer?.getBoundingClientRect().height ?? 0) : grid.scrollHeight
  return Math.ceil(content + (body.offsetHeight - body.clientHeight) + (card.offsetHeight - body.offsetHeight))
}

type TableCardProps = React.ComponentProps<"section"> & {
  /**
   * Trang vừa khít màn hình: cao theo nội dung (ít dòng thì thấp lại), co lại khi thiếu chỗ — chỉ thân bảng cuộn —
   * nhưng không thấp hơn đầu bảng + `minRows` dòng (tự đo DataGrid bên trong). Các khối khác cần nhường chỗ thì co trước.
   */
  fit?: boolean
  /** Số dòng luôn thấy được khi `fit` (mặc định 5). */
  minRows?: number
}

/**
 * Card danh sách: giãn hết chiều cao còn lại từ lg, không nhỏ hơn 20rem để không bị ép bẹp.
 * `fit`: xem `TableCardProps.fit`.
 */
function TableCard({ className, fit = false, minRows = 5, ref, ...props }: TableCardProps) {
  const own = React.useRef<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    const card = own.current
    if (!fit || !card) return
    let grid: Element | null = null
    const update = () => {
      const min = `${fitMinHeight(card, minRows)}px`
      if (card.style.minHeight !== min) card.style.minHeight = min
      // DataGrid xuất hiện / đổi sau khi tải → theo dõi cả nó (đổi số dòng, cột thu gọn…).
      const next = card.querySelector('[data-slot="data-grid"]')
      if (next !== grid) {
        if (grid) observer.unobserve(grid)
        if (next) observer.observe(next)
        grid = next
      }
    }
    const observer = new ResizeObserver(update)
    observer.observe(card)
    update()
    return () => {
      observer.disconnect()
      card.style.minHeight = ""
    }
  }, [fit, minRows])

  return (
    <section
      ref={(el) => {
        own.current = el
        if (typeof ref === "function") return ref(el)
        if (ref) ref.current = el
      }}
      data-slot="table-card"
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] border border-border bg-card",
        // `fit`: không giãn; co trước mọi khối khác (hệ số 1000) cho tới chiều cao tối thiểu đo được.
        fit ? "lg:shrink-[1000] lg:grow-0 lg:basis-auto" : "lg:min-h-80 lg:flex-1",
        className
      )}
      {...props}
    />
  )
}

/** Hàng cố định (tiêu đề, thanh công cụ): không co lại khi thân bảng cuộn. */
function TableCardBar({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="table-card-bar" className={cn("flex flex-none items-center gap-3", className)} {...props} />
}

/** Thân bảng: vùng cuộn duy nhất của trang từ lg. Đặt `<table>` bên trong, đầu bảng dùng `sticky top-0`. */
function TableCardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-card-body"
      className={cn(
        "max-h-[70vh] overflow-auto overscroll-contain lg:max-h-none lg:min-h-0 lg:flex-1",
        className
      )}
      {...props}
    />
  )
}

export { PageShell, TableCard, TableCardBar, TableCardBody }
export type { TableCardProps }
