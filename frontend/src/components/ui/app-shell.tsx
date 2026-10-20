import * as React from "react"
import { X } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/*
 * Khung trang trong (sau đăng nhập).
 * - Từ lg: sidebar và thanh trên chung nền `shell`, không đường kẻ; vùng nội dung là tấm `panel`
 *   bo góc trên trái, nổi lên bằng bóng — chỉ tấm này cuộn. Cuộn xuống thì mép trên có dải bóng mờ.
 * - Dưới lg: cuộn cả trang, sidebar thành menu trượt từ trái (lớp phủ, Esc để đóng).
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

  React.useEffect(() => {
    if (!mobileSidebarOpen) return
    drawerRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onMobileSidebarClose?.()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileSidebarOpen, onMobileSidebarClose])

  return (
    <div data-slot="app-shell" className={cn("flex min-h-dvh bg-page text-foreground lg:h-dvh lg:overflow-hidden lg:bg-shell", className)}>
      {sidebar && <div className="hidden lg:flex">{sidebar}</div>}

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
        {header}
        <div
          data-slot="app-shell-panel"
          className={cn(
            "relative flex flex-1 flex-col lg:mt-2 lg:min-h-0 lg:overflow-hidden lg:bg-panel lg:shadow-panel",
            sidebar ? "lg:rounded-tl-2xl" : "lg:mx-2 lg:rounded-t-2xl"
          )}
        >
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
  /** Ô logo 32px (vd. chữ "K"). */
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

function AppSidebar({ collapsed = false, logo, name, toggle, onClose, closeLabel = "Close menu", navLabel = "Main navigation", children, className }: AppSidebarProps) {
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
        <div className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-brand-gradient text-[15px] font-bold text-white">{logo}</div>
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
      <nav aria-label={navLabel} className="flex flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-4">
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

/** Mục điều hướng: đang chọn là thẻ nổi nền `card`; thu gọn thì nhãn hiện bằng tooltip. */
function SidebarNavItem({ icon, label, active = false, collapsed = false, badge, render = <a />, onClick }: SidebarNavItemProps) {
  const item = React.cloneElement(render, {
    "data-slot": "sidebar-nav-item",
    "data-active": active || undefined,
    "aria-current": active ? "page" : undefined,
    "aria-label": collapsed ? label : undefined,
    onClick,
    className: cn(
      "relative flex h-10 flex-none items-center gap-3 rounded-[10px] px-[15px] text-sm whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:size-[18px] [&>svg]:flex-none",
      active ? "bg-card font-semibold text-accent-foreground shadow-nav" : "text-text-secondary hover:bg-foreground/5"
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
