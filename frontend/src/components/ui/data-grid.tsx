import * as React from "react"
import { Funnel } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/*
 * Bảng dữ liệu dạng CSS grid cho bảng rộng nhiều cột (vd. Đề xuất KPI).
 * - Đặt làm con TRỰC TIẾP của khung cuộn (TableCardBody với `flex flex-col`): hàng nhóm cột + hàng tiêu đề dính trên,
 *   dòng tổng dính dưới (sticky bottom) trong cùng vùng cuộn nên luôn thẳng cột khi cuộn ngang.
 * - Ít dòng: một hàng đệm co giãn (1fr) đặt trước dòng tổng đẩy nó xuống đáy khung — khoảng trống nằm trên dòng tổng.
 * - Dòng tổng nền đặc; còn dòng bị che phía dưới thì hiện bóng mờ phía trên (`shadow-grid-footer`).
 * - Các cột `pinned` (phải đứng đầu, `width` là số px) dính bên trái khi cuộn ngang.
 * - Chữ hiển thị đều truyền qua props (thư viện không phụ thuộc i18n).
 */

/** Tông nền: `read` = dữ liệu chỉ đọc, `input` = cột nhập liệu, `locked` = chỉ người khác cập nhật, `plain` = nền card. */
type DataGridTone = "read" | "input" | "locked" | "plain"

type DataGridColumn<T> = {
  key: string
  /** Nhãn chính của tiêu đề cột. */
  header: React.ReactNode
  /** Dòng phụ dưới nhãn (vd. nhãn tiếng Trung, đơn vị). */
  sub?: React.ReactNode
  /** Tên đầy đủ hiện khi rê chuột / focus tiêu đề. */
  tooltip?: React.ReactNode
  /** Số = px; chuỗi = track CSS grid (vd. "minmax(180px,1fr)"). Cột `pinned` bắt buộc dùng số. */
  width: number | string
  align?: "start" | "end"
  /** Dính bên trái khi cuộn ngang — chỉ đặt cho các cột đầu tiên liên tiếp. */
  pinned?: boolean
  /** Nền tiêu đề cột (mặc định `plain`); `locked` còn tô cả ô thân bảng. */
  tone?: DataGridTone
  /** Kẻ dọc bên phải / bên trái cột để tách nhóm. */
  divider?: "start" | "end"
  /** Nội dung ô. */
  cell: (row: T, index: number) => React.ReactNode
  /** Ô chứa ô nhập (input/textarea/nút chọn): thêm padding dọc quanh ô nhập. */
  field?: boolean
  /** Lớp thêm cho ô thân bảng (vd. màu chữ riêng của cột). */
  cellClassName?: string | ((row: T) => string | undefined)
  /** Nội dung ô ở dòng tổng. */
  footer?: React.ReactNode
  /** Nút lọc trên tiêu đề: chỉ hiện khi rê chuột/focus tiêu đề, hoặc luôn hiện khi cột đang lọc (`active`). */
  filter?: { label: string; active?: boolean; onClick: () => void }
}

type DataGridGroup = {
  key: string
  /** Số cột mà nhóm phủ. */
  span: number
  label?: React.ReactNode
  tooltip?: React.ReactNode
  tone?: DataGridTone
  /** Chấm trước nhãn: `brand` = nhóm nhập liệu, `muted` = nhóm chỉ đọc. Mặc định theo `tone`. */
  marker?: "brand" | "muted"
  /** Kẻ dọc tách nhóm bên phải. */
  divider?: boolean
}

type DataGridProps<T> = {
  columns: DataGridColumn<T>[]
  /** Hàng nhóm cột phía trên tiêu đề; tổng `span` phải bằng số cột. */
  groups?: DataGridGroup[]
  rows: T[]
  rowKey: (row: T) => string
  /** Lớp cho cả dòng (vd. nền `bg-grid-row-muted`); ghi đè nền mặc định/sọc. Nền phải đục. */
  rowClassName?: (row: T, index: number) => string | undefined
  /** Lớp nền của vạch màu 3px ở mép trái dòng (vd. `bg-danger-text`); không truyền = không có vạch. */
  rowAccent?: (row: T) => string | undefined
  /** Sọc xen kẽ (dòng lẻ `bg-grid-row-alt`) thay cho đường kẻ giữa các dòng. */
  striped?: boolean
  /** Hiện khi `rows` rỗng. */
  empty?: React.ReactNode
  /** Nhãn dòng tổng, phủ các cột `pinned`. Không truyền = không có dòng tổng. */
  footerLabel?: React.ReactNode
  /** Nhãn của bảng cho trình đọc màn hình. */
  "aria-label"?: string
  className?: string
}

const GROUP_H = 30
const HEAD_BG: Record<DataGridTone, string> = {
  read: "bg-grid-head-read",
  input: "bg-grid-head-input",
  locked: "bg-grid-locked",
  plain: "bg-card",
}
const GROUP_BG: Record<DataGridTone, string> = {
  read: "bg-grid-group-read",
  input: "bg-grid-group-input",
  locked: "bg-grid-locked",
  plain: "bg-card",
}

const track = (w: number | string) => (typeof w === "number" ? `${w}px` : w)
/** Độ rộng tối thiểu của cột: số px, hoặc phần `min` của "minmax(96px,1fr)"; track khác tính 0. */
const minWidthOf = (w: number | string) => (typeof w === "number" ? w : Number(/minmax\(\s*(\d+(?:\.\d+)?)px/.exec(w)?.[1] ?? 0))

/** Nhãn có tooltip; focus được bằng bàn phím để đọc tên đầy đủ. */
function Label({ tooltip, className, children }: { tooltip?: React.ReactNode; className?: string; children: React.ReactNode }) {
  const label = (
    <span tabIndex={tooltip ? 0 : undefined} className={cn("min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)}>
      {children}
    </span>
  )
  return tooltip ? (
    <Tooltip content={tooltip} side="top" sideOffset={6}>
      {label}
    </Tooltip>
  ) : (
    label
  )
}

function DataGrid<T>({ columns, groups, rows, rowKey, rowClassName, rowAccent, striped = false, empty, footerLabel, className, ...aria }: DataGridProps<T>) {
  // Vị trí `left` của từng cột ghim = tổng độ rộng các cột ghim đứng trước.
  const pinnedLeft: number[] = []
  let left = 0
  for (const c of columns) {
    if (!c.pinned || typeof c.width !== "number") break
    pinnedLeft.push(left)
    left += c.width
  }
  const pinnedCount = pinnedLeft.length
  const hasFooter = footerLabel !== undefined
  const gridRef = React.useRef<HTMLDivElement>(null)
  // Còn dòng nằm dưới dòng tổng (chưa cuộn tới đáy) → bóng mờ phía trên dòng tổng.
  const [covered, setCovered] = React.useState(false)
  React.useEffect(() => {
    const grid = gridRef.current
    const scroller = grid?.parentElement
    if (!grid || !scroller || !hasFooter) return
    const update = () => setCovered(scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1)
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observer.observe(grid)
    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [hasFooter])
  // Hàng: [nhóm cột] + tiêu đề + các dòng (hoặc dòng trống) + hàng đệm 1fr + dòng tổng.
  const headRows = (groups?.length ? 1 : 0) + 1
  const bodyRows = rows.length || (empty ? 1 : 0)
  const gridTemplateRows = hasFooter ? `repeat(${headRows + bodyRows}, auto) 1fr auto` : undefined
  const footerCell = cn(
    "sticky bottom-0 flex h-11 min-w-0 items-center border-t border-t-border-strong bg-card px-1.5 font-semibold whitespace-nowrap tabular-nums transition-shadow duration-150",
    covered && "shadow-grid-footer"
  )

  const pin = (i: number) => (i < pinnedCount ? { left: pinnedLeft[i] } : undefined)
  const headTop = groups?.length ? GROUP_H : 0
  const align = (c: DataGridColumn<T>) => (c.align === "end" ? "justify-end text-right" : "")
  const divider = (c: DataGridColumn<T>) => (c.divider === "end" ? "border-r border-r-border" : c.divider === "start" ? "border-l border-l-border" : "")

  return (
    <div
      ref={gridRef}
      role="table"
      aria-label={aria["aria-label"]}
      data-slot="data-grid"
      // Rộng bằng khung; khung hẹp hơn tổng độ rộng tối thiểu thì cuộn ngang (cột `1fr` chỉ giãn trong phần dư).
      className={cn("grid w-full flex-1 text-xs leading-[1.35]", className)}
      style={{ gridTemplateColumns: columns.map((c) => track(c.width)).join(" "), gridTemplateRows, minWidth: columns.reduce((s, c) => s + minWidthOf(c.width), 0) }}
    >
      {groups && groups.length > 0 && (
        <div role="row" className="contents">
          {groups.map((g, gi) => {
            const sticky = gi === 0 && pinnedCount > 0
            const marker = g.marker ?? (g.tone === "input" ? "brand" : "muted")
            return (
              <div
                key={g.key}
                role="columnheader"
                aria-colspan={g.span}
                style={{ gridColumn: `span ${g.span}`, height: GROUP_H, ...(sticky ? { left: 0 } : null) }}
                className={cn(
                  "sticky top-0 flex min-w-0 items-center gap-1.5 border-b border-border px-2.5 first:pl-3 font-medium whitespace-nowrap text-foreground",
                  sticky ? "z-7 overflow-visible" : "z-4 overflow-hidden",
                  GROUP_BG[g.tone ?? "plain"],
                  g.divider && "border-r border-r-card"
                )}
              >
                {g.label && (
                  <>
                    <span aria-hidden="true" className={cn("size-1.5 flex-none rounded-full", marker === "brand" ? "bg-brand" : "bg-muted-foreground")} />
                    <Label tooltip={g.tooltip} className={sticky ? undefined : "truncate"}>
                      {g.label}
                    </Label>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div role="row" className="contents">
        {columns.map((c, i) => (
          <div
            key={c.key}
            role="columnheader"
            style={{ top: headTop, ...pin(i) }}
            className={cn(
              "group/head sticky flex h-11 min-w-0 items-center border-b border-border px-1.5",
              i === 0 && "pl-3",
              i < pinnedCount ? "z-6" : "z-4",
              HEAD_BG[c.tone ?? "plain"],
              align(c),
              divider(c)
            )}
          >
            <Label tooltip={c.tooltip} className={cn("flex max-w-full flex-col gap-px", c.align === "end" && "items-end")}>
              <span className="max-w-full truncate font-medium text-foreground">{c.header}</span>
              <span className="max-w-full truncate text-[11px] text-muted-foreground">{c.sub ?? " "}</span>
            </Label>
            {c.filter && (
              <button
                type="button"
                aria-label={c.filter.label}
                aria-pressed={!!c.filter.active}
                onClick={c.filter.onClick}
                className={cn(
                  "absolute top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-sm shadow-[0_0_0_3px_var(--card)] outline-none transition-opacity duration-150 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-[11px]",
                  c.align === "end" ? "left-0.5" : "right-0.5",
                  c.filter.active ? "bg-accent text-brand-text opacity-100" : "bg-muted text-foreground opacity-0 group-hover/head:opacity-100 group-focus-within/head:opacity-100"
                )}
              >
                <Funnel aria-hidden="true" strokeWidth={2.2} />
              </button>
            )}
          </div>
        ))}
      </div>

      {rows.map((row, ri) => {
        const base = striped && ri % 2 === 1 ? "bg-grid-row-alt" : "bg-card"
        const rowCls = rowClassName?.(row, ri)
        const accent = rowAccent?.(row)
        return (
          <div key={rowKey(row)} role="row" className="contents">
            {columns.map((c, i) => (
              <div
                key={c.key}
                role="cell"
                style={pin(i)}
                className={cn(
                  "flex min-h-11 min-w-0 items-center",
                  !striped && "border-b border-border",
                  "px-1.5",
                  c.field && "py-1.5",
                  i === 0 && "pl-3",
                  i < pinnedCount ? "sticky z-1" : i === 0 && "relative",
                  base,
                  rowCls,
                  align(c),
                  divider(c),
                  c.tone === "locked" && "bg-grid-locked",
                  typeof c.cellClassName === "function" ? c.cellClassName(row) : c.cellClassName
                )}
              >
                {i === 0 && accent && <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-[3px]", accent)} />}
                {c.cell(row, ri)}
              </div>
            ))}
          </div>
        )
      })}

      {rows.length === 0 && empty && (
        <div role="row" className="contents">
          <div role="cell" className="col-span-full border-b border-border p-6 text-center text-muted-foreground">
            {empty}
          </div>
        </div>
      )}

      {hasFooter && (
        <>
          {/* Hàng đệm co giãn: ít dòng thì khoảng trống dồn ở đây, dòng tổng nằm sát đáy khung. */}
          <div aria-hidden="true" className="col-span-full" />
          <div role="row" className="contents">
            {pinnedCount > 0 && (
              <div role="cell" style={{ gridColumn: `span ${pinnedCount}`, left: 0 }} className={cn(footerCell, "z-5 gap-1.5 border-r border-r-border pl-3")}>
                {footerLabel}
              </div>
            )}
            {columns.slice(pinnedCount).map((c) => (
              <div key={c.key} role="cell" className={cn(footerCell, "z-3", align(c))}>
                {c.footer}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export { DataGrid }
export type { DataGridColumn, DataGridGroup, DataGridProps, DataGridTone }
