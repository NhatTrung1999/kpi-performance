import * as React from "react"
import { X } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { useGlassUi } from "@/lib/ui-theme"
import { cn } from "@/lib/utils"

/*
 * Khung trang trong (sau đăng nhập).
 * - Từ lg: sidebar và thanh trên chung nền `shell`, không đường kẻ; vùng nội dung là tấm `panel`
 *   bo góc trên trái, nổi lên bằng bóng — chỉ tấm này cuộn. Cuộn xuống thì mép trên có dải bóng mờ.
 * - Dưới lg: cuộn cả trang, sidebar thành menu trượt từ trái (lớp phủ, Esc để đóng); tấm nội dung vẫn là kính tối, cách mép 8px.
 * Chữ hiển thị đều truyền qua props (thư viện không phụ thuộc i18n).
 */

type AppShellProps = {
  /** Sidebar desktop (thường là AppSidebar). Bỏ trống = không có sidebar: tấm nội dung bo hai góc trên, cách hai mép. */
  sidebar?: React.ReactNode
  /** Sidebar trong menu trượt mobile. */
  mobileSidebar?: React.ReactNode
  mobileSidebarOpen?: boolean
  onMobileSidebarClose?: () => void
  /** Thanh trên. */
  header: React.ReactNode
  children: React.ReactNode
  className?: string
}

function AppShell({ sidebar, mobileSidebar, mobileSidebarOpen = false, onMobileSidebarClose, header, children, className }: AppShellProps) {
  const [scrolled, setScrolled] = React.useState(false)
  const drawerRef = React.useRef<HTMLDivElement>(null)
  // Giao diện kính (mặc định) hay phẳng sáng — người dùng chọn ở thanh trên (lib/ui-theme.ts).
  const glass = useGlassUi()

  React.useEffect(() => {
    if (!mobileSidebarOpen) return
    drawerRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onMobileSidebarClose?.()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileSidebarOpen, onMobileSidebarClose])

  return (
    <div data-slot="app-shell" className={cn("flex min-h-dvh text-foreground lg:h-dvh lg:overflow-hidden", glass ? "shell-pattern bg-shell" : "flat-backdrop", className)}>
      {sidebar && <div className={cn("hidden lg:flex", glass && "shell-inverse")}>{sidebar}</div>}

      {mobileSidebar && (
        <>
          <div
            aria-hidden="true"
            onClick={onMobileSidebarClose}
            className={cn(
              "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
              mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            inert={!mobileSidebarOpen}
            className={cn(
              "fixed inset-y-0 left-0 z-41 flex outline-none transition-transform duration-200 ease-out lg:hidden",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {mobileSidebar}
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={cn("contents", glass && "shell-inverse")}>{header}</div>
        <div
          data-slot="app-shell-panel"
          className={cn(
            "relative flex flex-1 flex-col lg:min-h-0 lg:overflow-hidden",
            glass && [
              "mx-2 mt-2 rounded-t-2xl bg-panel",
              // Có sidebar (từ lg): lấn 1px (= độ dày viền) vào dưới sidebar để viền mép trái tấm trùng cột với đầu cung góc lõm của tab.
              sidebar && "lg:mr-0 lg:-ml-px lg:rounded-t-none lg:rounded-tl-2xl",
              // Tấm nội dung là kính tối (Liquid Glass) trên nền khung màu loang → nội dung bên trong dùng token tông tối.
              "dark liquid-panel text-foreground",
            ]
          )}
        >
          {glass && <div aria-hidden="true" className="liquid-rim" />}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-3.5 bg-linear-to-b from-foreground/10 to-transparent transition-opacity duration-200 lg:block",
              scrolled ? "opacity-100" : "opacity-0"
            )}
          />
          <div
            onScroll={(e) => {
              const v = e.currentTarget.scrollTop > 2
              if (v !== scrolled) setScrolled(v)
            }}
            className="flex flex-1 flex-col lg:min-h-0 lg:overflow-y-auto"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

type AppSidebarProps = {
  /** Thu gọn còn 72px: chỉ icon, nhãn hiện bằng tooltip. */
  collapsed?: boolean
  /** Logo 32px (vd. `<AppLogo />`), hiện nguyên như truyền vào. */
  logo: React.ReactNode
  /** Tên ứng dụng cạnh logo. */
  name: React.ReactNode
  /** Nút đóng/mở (SidebarToggle) — cạnh logo khi mở rộng, dưới logo khi thu gọn. */
  toggle?: React.ReactNode
  /** Có thì hiện nút X (menu trượt mobile). */
  onClose?: () => void
  closeLabel?: string
  /** Nhãn vùng điều hướng cho trình đọc màn hình. */
  navLabel?: string
  children: React.ReactNode
  className?: string
}

/**
 * Từ lg: nền "tab" của mục đang chọn là MỘT lớp riêng trong nav, trượt tới vị trí mục có `data-active` mỗi khi mục đó đổi
 * (đổi trang) — nav theo dõi thuộc tính bằng MutationObserver và kích thước bằng ResizeObserver (thu gọn sidebar, đổi ngôn ngữ).
 * Lần đo đầu không trượt (đặt thẳng vào chỗ). Bật "giảm chuyển động" thì đổi ngay.
 * Tab cùng nền `panel`, kéo sát mép phải sidebar, bỏ bo góc phải, hai góc lõm (16px) trên/dưới vẽ bằng ::before/::after.
 */
const TAB_CORNERS = cn(
  "before:pointer-events-none before:absolute before:right-0 before:bottom-full before:size-4 before:bg-[radial-gradient(circle_at_0_0,transparent_15.5px,var(--color-panel)_16px)]",
  "after:pointer-events-none after:absolute after:top-full after:right-0 after:size-4 after:bg-[radial-gradient(circle_at_0_100%,transparent_15.5px,var(--color-panel)_16px)]"
)

/**
 * Viền kính quanh tab mục đang chọn — MỘT nét SVG liền: cung lõm trên → mép trên → 2 góc bo trái (10px) → mép dưới → cung lõm
 * dưới. Ghép từ nhiều phần tử (border của tab, của góc lõm…) thì mỗi tỉ lệ màn hình trình duyệt làm tròn mỗi phần một kiểu nên
 * lệch nhau ở chỗ nối; một nét duy nhất thì không. Toạ độ tính trong khung tab (rộng w, cao h), SVG lùi lên 16px để chứa cung trên.
 * Nét dày 1px: mép trên/dưới/trái nằm trong tab; hai đầu cung rơi đúng cột viền mép trái tấm (cột [w-1, w], tấm lấn 1px vào dưới
 * sidebar) → nối thẳng với viền tấm (.liquid-rim chừa trống đúng từ đầu cung trên tới đầu cung dưới). Cung là elip 15.5×16.5
 * (tâm ở góc ô lõm 16px) để vừa chạm cột đó vừa chạm mép trên/dưới tab.
 */
function tabOutline(w: number, h: number) {
  const b = h + 16 // mép dưới tab trong toạ độ SVG
  return [
    `M ${w - 0.5} 0`,
    `A 15.5 16.5 0 0 1 ${w - 16} 16.5`,
    `L 10 16.5`,
    `A 9.5 9.5 0 0 0 0.5 26`,
    `L 0.5 ${b - 10}`,
    `A 9.5 9.5 0 0 0 10 ${b - 0.5}`,
    `L ${w - 16} ${b - 0.5}`,
    `A 15.5 16.5 0 0 1 ${w - 0.5} ${b + 16}`,
  ].join(" ")
}

function useActiveTab(navRef: React.RefObject<HTMLElement | null>) {
  const [tab, setTab] = React.useState<{ top: number; height: number; width: number; animate: boolean } | null>(null)
  React.useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('[data-slot="sidebar-nav-item"][data-active]')
      // Đoạn viền trái của tấm nội dung cần chừa trống chỗ tab nối vào (tab + 2 góc lõm 16px) — xem .liquid-rim.
      // Chỉ sidebar đang hiển thị mới ghi: bản menu trượt mobile (ẩn từ lg) đo ra toàn 0 và sẽ ghi đè số đúng.
      const panel = document.querySelector<HTMLElement>('[data-slot="app-shell-panel"]')
      if (panel && nav.getClientRects().length > 0) {
        const p = panel.getBoundingClientRect()
        const r = el?.getBoundingClientRect()
        // Hai đầu nét viền tab (tabOutline) cách mép tab đúng 16px: viền tấm dừng/tiếp đúng ở đó.
        panel.style.setProperty("--tab-gap-top", r ? `${r.top - p.top - 16}px` : "0px")
        panel.style.setProperty("--tab-gap-bottom", r ? `${r.bottom - p.top + 16}px` : "0px")
      }
      setTab((prev) => {
        if (!el) return null
        const next = { top: el.offsetTop, height: el.offsetHeight, width: el.offsetWidth }
        if (prev && prev.top === next.top && prev.height === next.height && prev.width === next.width) return prev
        return { ...next, animate: prev !== null }
      })
    }
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(nav, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-active"] })
    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    nav.addEventListener("scroll", measure, { passive: true })
    return () => {
      mo.disconnect()
      ro.disconnect()
      nav.removeEventListener("scroll", measure)
    }
  }, [navRef])
  return tab
}

function AppSidebar({ collapsed = false, logo, name, toggle, onClose, closeLabel = "Close menu", navLabel = "Main navigation", children, className }: AppSidebarProps) {
  const navRef = React.useRef<HTMLElement>(null)
  const measured = useActiveTab(navRef)
  // Giao diện phẳng: không có tab kính nối tấm — mục đang chọn là thẻ nổi nền `card` (SidebarNavItem).
  const tab = useGlassUi() ? measured : null
  return (
    <aside
      data-slot="app-sidebar"
      data-collapsed={collapsed || undefined}
      className={cn(
        "group/sidebar relative z-20 flex h-full flex-none flex-col overflow-hidden transition-[width] duration-200 ease-out",
        collapsed ? "w-18" : "w-62",
        className
      )}
    >
      <div className="flex h-14 flex-none items-center gap-3 pr-3 pl-5">
        {logo}
        {!collapsed && <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-[-0.01em]">{name}</span>}
        {!collapsed && toggle}
        {onClose && (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="flex size-9 flex-none items-center justify-center rounded-lg text-text-secondary outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      {collapsed && toggle && <div className="flex justify-center pt-0.5">{toggle}</div>}
      <nav ref={navRef} aria-label={navLabel} className="relative flex flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-4">
        {tab && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-0 right-0 left-3 hidden lg:block",
              tab.animate && "transition-[transform,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            )}
            style={{ height: tab.height, transform: `translateY(${tab.top}px)` }}
          >
            {/* Thân tab + đoạn nối 16px cuối (mang 2 góc lõm) chỉ là nền kính; viền là một nét SVG (tabOutline). */}
            <span className="liquid-tab absolute inset-y-0 right-4 left-0 rounded-l-[10px] bg-panel" />
            <span className={cn("liquid-tab-joint absolute inset-y-0 right-0 w-4 bg-panel", TAB_CORNERS)} />
            <svg className="absolute -top-4 left-0 overflow-visible" width={tab.width} height={tab.height + 32} fill="none">
              <path d={tabOutline(tab.width, tab.height)} stroke="var(--glass-rim)" strokeWidth={1} />
            </svg>
          </span>
        )}
        {children}
      </nav>
    </aside>
  )
}

/** Nhóm mục điều hướng: nhãn chữ hoa khi mở rộng, đường kẻ ngắn khi thu gọn. */
function SidebarNavGroup({ label, collapsed = false, children, className }: { label?: string | null; collapsed?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label ?? undefined} className={cn("flex flex-col gap-0.5 not-first:mt-4", className)}>
      {label &&
        (collapsed ? (
          <div aria-hidden="true" className="mx-2 mt-2 mb-2.5 h-px bg-border" />
        ) : (
          <span aria-hidden="true" className="px-3 pb-1.5 text-[11px] font-semibold tracking-[.08em] whitespace-nowrap text-muted-foreground uppercase">
            {label}
          </span>
        ))}
      {children}
    </div>
  )
}

type SidebarNavItemProps = {
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed?: boolean
  /** Số đếm (vd. thông báo chưa đọc): chip khi mở rộng, chấm khi thu gọn. */
  badge?: number
  /** Phần tử link của router, vd. `<Link to="/kpi" />`; mặc định là `<a>`. */
  render?: React.ReactElement<Record<string, unknown>>
  onClick?: () => void
}

/**
 * Từ lg: nền của mục đang chọn là lớp tab trượt trong AppSidebar (xem useActiveTab) — mục chỉ trong suốt và kéo sát mép phải.
 * Dưới lg (menu trượt mobile, không có tấm nội dung kề bên) vẫn là thẻ nổi nền `card`.
 */
const ACTIVE_TAB = "lg:-mr-3 lg:rounded-r-none lg:bg-transparent lg:text-[var(--tab-foreground)] lg:shadow-none"

/** Mục điều hướng: đang chọn là thẻ nổi nền `card` (từ lg: tab nối liền tấm nội dung); thu gọn thì nhãn hiện bằng tooltip. */
function SidebarNavItem({ icon, label, active = false, collapsed = false, badge, render = <a />, onClick }: SidebarNavItemProps) {
  const glass = useGlassUi()
  const item = React.cloneElement(render, {
    "data-slot": "sidebar-nav-item",
    "data-active": active || undefined,
    "aria-current": active ? "page" : undefined,
    "aria-label": collapsed ? label : undefined,
    onClick,
    className: cn(
      "relative z-1 flex h-10 flex-none items-center gap-3 rounded-[10px] px-[15px] text-sm whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:size-[18px] [&>svg]:flex-none",
      active ? cn("bg-card font-semibold text-accent-foreground shadow-nav", glass && ACTIVE_TAB) : "text-text-secondary"
    ),
    children: (
      <>
        {icon}
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {badge !== undefined &&
          (collapsed ? (
            <span aria-hidden="true" className="absolute top-2 right-3 size-2 rounded-full border-2 border-shell bg-danger" />
          ) : (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-foreground tabular-nums">
              {badge}
            </span>
          ))}
      </>
    ),
  })
  return (
    <Tooltip content={label} disabled={!collapsed}>
      {item}
    </Tooltip>
  )
}

export { AppShell, AppSidebar, SidebarNavGroup, SidebarNavItem }
export type { AppShellProps, AppSidebarProps, SidebarNavItemProps }
