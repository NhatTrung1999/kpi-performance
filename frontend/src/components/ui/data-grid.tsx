import * as React from "react"
import { Funnel, Minus, Plus } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/*
 * Bảng dữ liệu dạng CSS grid cho bảng rộng nhiều cột (vd. Đề xuất KPI, Thăng chức & lương).
 * - Đặt làm con TRỰC TIẾP của khung cuộn (TableCardBody với `flex flex-col`): hàng nhóm cột + hàng tiêu đề dính trên,
 *   dòng tổng dính dưới (sticky bottom) trong cùng vùng cuộn nên luôn thẳng cột khi cuộn ngang.
 * - Ít dòng: một hàng đệm co giãn (1fr) đặt trước dòng tổng đẩy nó xuống đáy khung — khoảng trống nằm trên dòng tổng.
 * - Dòng tổng nền đặc; còn dòng bị che phía dưới thì hiện bóng mờ phía trên (`shadow-grid-footer`).
 * - Các cột `pinned` (phải đứng đầu, `width` là số px) dính bên trái khi cuộn ngang; đã cuộn thì mép phải phần cố định
 *   có bóng mờ (`shadow-grid-pin`). Nhóm cột vắt qua mép cố định được tách đôi: phần cố định mang nhãn, nằm đè lên trên.
 * - Nhãn nhóm của phần cuộn dính ngay sau mép cố định nên vẫn đọc được khi cuộn tới giữa nhóm.
 * - `wrapHeaders`: tiêu đề và nhãn nhóm xuống dòng (không cắt chữ), chiều cao hàng nhóm đo theo nội dung.
 * - Nhóm có `collapse` thu gọn được thành một cột hẹp (giữ lại các cột cố định của nhóm), như group cột của Excel.
 * - Chữ hiển thị đều truyền qua props (thư viện không phụ thuộc i18n).
 */

/**
 * Tông nền: `read` = dữ liệu chỉ đọc, `input` = cột nhập liệu, `locked` = chỉ người khác cập nhật, `plain` = nền card;
 * `warn` / `info` / `salary` / `success` = tô nhóm cột theo nguồn dữ liệu (vd. CQ tự điền, hệ thống KPI, lương, HR).
 */
type DataGridTone = "read" | "input" | "locked" | "plain" | "warn" | "info" | "salary" | "success"

type DataGridColumn<T> = {
  key: string
  /** Nhãn chính của tiêu đề cột. */
  header: React.ReactNode
  /** Dòng phụ dưới nhãn (vd. nhãn tiếng Trung, đơn vị). */
  sub?: React.ReactNode
  /** Ghi chú nghiêng dưới tiêu đề (vd. "HT tự tính") — chỉ hiện khi `wrapHeaders`. */
  note?: React.ReactNode
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
  /** Chấm trước nhãn: `brand` = nhóm nhập liệu, `muted` = nhóm chỉ đọc, hoặc màu trạng thái. Mặc định theo `tone`. */
  marker?: "brand" | "muted" | "warning" | "info" | "success"
  /** Kẻ dọc tách nhóm bên phải. */
  divider?: boolean
  /** Thu gọn được: `label` là nhãn cho trình đọc màn hình của nút −/+ (vd. "Thu gọn nhóm: …"). */
  collapse?: { collapsed: boolean; onToggle: () => void; label: string }
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
  /** Tiêu đề cột và nhãn nhóm xuống dòng thay vì cắt bằng "…". */
  wrapHeaders?: boolean
  /** Hiện khi `rows` rỗng. */
  empty?: React.ReactNode
  /** Nhãn dòng tổng, phủ các cột `pinned`. Không truyền = không có dòng tổng. */
  footerLabel?: React.ReactNode
  /** Nhãn của bảng cho trình đọc màn hình. */
  "aria-label"?: string
  className?: string
}

const GROUP_H = 30
/** Độ rộng cột còn lại khi nhóm thu gọn. */
const COLLAPSED_W = 40
const HEAD_BG: Record<DataGridTone, string> = {
  read: "bg-grid-head-read",
  input: "bg-grid-head-input",
  locked: "bg-grid-locked",
  plain: "bg-card",
  warn: "bg-grid-head-warn",
  info: "bg-grid-head-info",
  salary: "bg-grid-head-salary",
  success: "bg-grid-head-success",
}
const GROUP_BG: Record<DataGridTone, string> = {
  read: "bg-grid-group-read",
  input: "bg-grid-group-input",
  locked: "bg-grid-locked",
  plain: "bg-card",
  warn: "bg-grid-group-warn",
  info: "bg-grid-group-info",
  salary: "bg-grid-group-salary",
  success: "bg-grid-group-success",
}
const MARKER_BG = { brand: "bg-brand", muted: "bg-muted-foreground", warning: "bg-warning", info: "bg-info", success: "bg-success" } as const

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

/** Một ô của hàng nhóm sau khi đã thu gọn và tách theo mép cố định. */
type GroupCell = { group: DataGridGroup; start: number; span: number; pinned: boolean; head: boolean }

function DataGrid<T>({ columns: allColumns, groups: allGroups, rows, rowKey, rowClassName, rowAccent, striped = false, wrapHeaders = false, empty, footerLabel, className, ...aria }: DataGridProps<T>) {
  // Nhóm thu gọn: giữ các cột cố định của nhóm, phần còn lại thay bằng một cột hẹp không có nội dung.
  const columns: DataGridColumn<T>[] = []
  const groups: DataGridGroup[] = []
  if (allGroups?.length) {
    let i = 0
    for (const g of allGroups) {
      const own = allColumns.slice(i, i + g.span)
      i += g.span
      if (!g.collapse?.collapsed) {
        columns.push(...own)
        groups.push(g)
        continue
      }
      const kept = own.filter((c) => c.pinned)
      columns.push(...kept, { key: `__collapsed-${g.key}`, header: null, width: COLLAPSED_W, tone: g.tone, cell: () => null })
      groups.push({ ...g, span: kept.length + 1 })
    }
  } else columns.push(...allColumns)

  // Vị trí `left` của từng cột ghim = tổng độ rộng các cột ghim đứng trước.
  const pinnedLeft: number[] = []
  let left = 0
  for (const c of columns) {
    if (!c.pinned || typeof c.width !== "number") break
    pinnedLeft.push(left)
    left += c.width
  }
  const pinnedCount = pinnedLeft.length
  const pinnedWidth = left

  // Nhóm vắt qua mép cố định → tách: phần cố định (mang nhãn) + phần cuộn (không nhãn).
  const groupCells: GroupCell[] = []
  let start = 0
  for (const g of groups) {
    const end = start + g.span
    if (start < pinnedCount && end > pinnedCount) {
      groupCells.push({ group: g, start, span: pinnedCount - start, pinned: true, head: true })
      groupCells.push({ group: g, start: pinnedCount, span: end - pinnedCount, pinned: false, head: false })
    } else groupCells.push({ group: g, start, span: g.span, pinned: end <= pinnedCount && pinnedCount > 0, head: true })
    start = end
  }

  const hasFooter = footerLabel !== undefined
  const gridRef = React.useRef<HTMLDivElement>(null)
  const groupRowRef = React.useRef<HTMLDivElement>(null)
  // Còn dòng nằm dưới dòng tổng (chưa cuộn tới đáy) → bóng mờ phía trên dòng tổng.
  const [covered, setCovered] = React.useState(false)
  // Đã cuộn ngang → bóng mờ ở mép phải phần cố định.
  const [scrolledX, setScrolledX] = React.useState(false)
  // Chiều cao thật của hàng nhóm (nhãn xuống dòng) để hàng tiêu đề dính ngay bên dưới.
  const [groupH, setGroupH] = React.useState(GROUP_H)
  React.useEffect(() => {
    const grid = gridRef.current
    const scroller = grid?.parentElement
    if (!grid || !scroller) return
    const update = () => {
      if (hasFooter) setCovered(scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1)
      setScrolledX(scroller.scrollLeft > 0)
      if (groupRowRef.current) setGroupH(groupRowRef.current.offsetHeight || GROUP_H)
    }
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observer.observe(grid)
    if (groupRowRef.current) observer.observe(groupRowRef.current)
    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [hasFooter])
  // Hàng: [nhóm cột] + tiêu đề + các dòng (hoặc dòng trống) + hàng đệm 1fr + dòng tổng.
  const headRows = (groups.length ? 1 : 0) + 1
  const bodyRows = rows.length || (empty ? 1 : 0)
  const gridTemplateRows = hasFooter ? `repeat(${headRows + bodyRows}, auto) 1fr auto` : undefined
  const pinEdge = scrolledX && "shadow-grid-pin"
  const footerCell = cn(
    "sticky bottom-0 flex h-11 min-w-0 items-center border-t border-t-border-strong bg-card px-1.5 font-semibold whitespace-nowrap tabular-nums transition-shadow duration-150",
    covered && "shadow-grid-footer"
  )

  const pin = (i: number) => (i < pinnedCount ? { left: pinnedLeft[i] } : undefined)
  const lastPinned = (i: number) => pinnedCount > 0 && i === pinnedCount - 1
  const headTop = groups.length ? (wrapHeaders ? groupH : GROUP_H) : 0
  const align = (c: DataGridColumn<T>) => (c.align === "end" ? "justify-end text-right" : "")
  const divider = (c: DataGridColumn<T>) => (c.divider === "end" ? "border-r border-r-border" : c.divider === "start" ? "border-l border-l-border" : "")

  return (
    <div
      ref={gridRef}
      role="table"
      aria-label={aria["aria-label"]}
      data-slot="data-grid"
      // Rộng bằng khung; khung hẹp hơn tổng độ rộng tối thiểu thì cuộn ngang (cột `1fr` chỉ giãn trong phần dư).
      // Không có dòng tổng: dồn các hàng lên trên, không để hàng nhóm/tiêu đề giãn ra khi bảng ít dòng.
      className={cn("grid w-full flex-1 text-xs leading-[1.35]", !hasFooter && "content-start", className)}
      style={{ gridTemplateColumns: columns.map((c) => track(c.width)).join(" "), gridTemplateRows, minWidth: columns.reduce((s, c) => s + minWidthOf(c.width), 0) }}
    >
      {groupCells.length > 0 && (
        <div role="row" className="contents">
          {groupCells.map((gc, gi) => {
            const g = gc.group
            const marker = g.marker ?? (g.tone === "input" ? "brand" : "muted")
            const collapsed = !!g.collapse?.collapsed
            // Nhóm cuộn đã thu gọn chỉ còn cột hẹp: chỉ hiện nút mở rộng.
            const showLabel = gc.head && !!g.label && !(collapsed && !gc.pinned)
            const ends = gc.start + gc.span === pinnedCount
            return (
              <div
                key={`${g.key}-${gc.start}`}
                ref={gi === 0 ? groupRowRef : undefined}
                role="columnheader"
                aria-colspan={gc.span}
                style={{ gridColumn: `span ${gc.span}`, ...(wrapHeaders ? { minHeight: GROUP_H } : { height: GROUP_H }), ...(gc.pinned ? { left: pinnedLeft[gc.start] } : null) }}
                className={cn(
                  "sticky top-0 flex min-w-0 gap-1.5 border-b border-border px-2.5 font-medium text-foreground transition-shadow duration-150",
                  gc.start === 0 && "pl-3",
                  wrapHeaders ? "items-start py-2" : "items-center whitespace-nowrap",
                  gc.pinned ? "z-7 overflow-hidden" : "z-4 overflow-clip",
                  GROUP_BG[g.tone ?? "plain"],
                  wrapHeaders && gc.start > 0 && gc.head && "border-l border-l-border-strong",
                  g.divider && !wrapHeaders && "border-r border-r-card",
                  gc.pinned && ends && cn("border-r border-r-border-strong", pinEdge)
                )}
              >
                <span
                  // Phần cuộn: nhãn dính ngay sau mép cố định nên vẫn thấy khi cuộn tới giữa nhóm.
                  style={!gc.pinned && pinnedCount > 0 ? { left: pinnedWidth + 10 } : undefined}
                  className={cn("flex min-w-0 gap-1.5", wrapHeaders ? "items-start" : "items-center", !gc.pinned && pinnedCount > 0 && "sticky")}
                >
                  {gc.head && g.collapse && (
                    <button
                      type="button"
                      onClick={g.collapse.onToggle}
                      aria-expanded={!collapsed}
                      aria-label={g.collapse.label}
                      title={g.collapse.label}
                      className="flex size-5 flex-none items-center justify-center rounded-md border border-border-strong bg-card text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3"
                    >
                      {collapsed ? <Plus aria-hidden="true" strokeWidth={2.4} /> : <Minus aria-hidden="true" strokeWidth={2.4} />}
                    </button>
                  )}
                  {showLabel && (
                    <>
                      <span aria-hidden="true" className={cn("size-1.5 flex-none rounded-full", MARKER_BG[marker], wrapHeaders && "mt-1.5")} />
                      <Label tooltip={g.tooltip} className={wrapHeaders ? "whitespace-normal" : "truncate"}>
                        {g.label}
                      </Label>
                    </>
                  )}
                </span>
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
              "group/head sticky flex min-w-0 border-b border-border px-1.5 transition-shadow duration-150",
              wrapHeaders ? "min-h-11 items-start py-2" : "h-11 items-center",
              i === 0 && "pl-3",
              i < pinnedCount ? "z-6" : "z-4",
              HEAD_BG[c.tone ?? "plain"],
              align(c),
              divider(c),
              lastPinned(i) && cn("border-r border-r-border-strong", pinEdge)
            )}
          >
            <Label tooltip={c.tooltip} className={cn("flex max-w-full flex-col gap-px", c.align === "end" && "items-end")}>
              <span className={cn("max-w-full font-medium text-foreground", wrapHeaders ? "text-balance" : "truncate")}>{c.header}</span>
              <span className={cn("max-w-full text-[11px] text-muted-foreground", wrapHeaders ? "text-balance" : "truncate")}>{c.sub ?? " "}</span>
              {wrapHeaders && c.note && <span className="mt-0.5 max-w-full text-[10.5px] leading-tight font-normal text-pretty text-muted-foreground">{c.note}</span>}
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
                  i < pinnedCount ? "sticky z-1 transition-shadow duration-150" : i === 0 && "relative",
                  base,
                  rowCls,
                  align(c),
                  divider(c),
                  c.tone === "locked" && "bg-grid-locked",
                  lastPinned(i) && cn("border-r border-r-border-strong", pinEdge),
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
              <div role="cell" style={{ gridColumn: `span ${pinnedCount}`, left: 0 }} className={cn(footerCell, "z-5 gap-1.5 border-r border-r-border-strong pl-3", scrolledX && !covered && "shadow-grid-pin")}>
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
