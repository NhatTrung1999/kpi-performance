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

/** Sóng ở mép dưới dải gradient đầu trang. */
const BAND_WAVES = [
  { d: "M0 40 C 200 6 380 70 600 40 S 1000 8 1200 36 V70 H0z", fill: "rgb(255 255 255 / 0.08)" },
  { d: "M0 56 C 240 30 420 80 640 52 S 1000 30 1200 56 V70 H0z", fill: "rgb(255 255 255 / 0.1)" },
]

/**
 * Dải gradient có hoa văn sau thanh trên + băng tiêu đề trang (`[data-slot="page-banner"]`). Chiều cao `--band-h` đo lại khi
 * nội dung đổi / cuộn / đổi cỡ: tới dưới băng tiêu đề 18px, khi cuộn co theo nhưng không thấp hơn thanh trên. Trang không có
 * băng tiêu đề thì cao hơn thanh trên một chút.
 */
function useShellBand(columnRef: React.RefObject<HTMLDivElement | null>, scrollRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  React.useLayoutEffect(() => {
    const col = columnRef.current
    const scroller = scrollRef.current
    if (!enabled || !col || !scroller) return
    let frame = 0
    const update = () => {
      frame = 0
      // Đo từ mép trên của chính dải (từ lg dải lùi 12px so với cột), không phải mép trên cột.
      const band = col.querySelector<HTMLElement>('[data-slot="shell-band"]')
      const top = (band ?? col).getBoundingClientRect().top
      const header = col.querySelector<HTMLElement>("header")
      const min = (header?.offsetHeight ?? 56) + 14
      const banner = scroller.querySelector<HTMLElement>('[data-slot="page-banner"]')
      // Băng tiêu đề trượt vào lúc mở trang (animate-banner-enter): trừ phần dịch chuyển đang có để đo đúng vị trí cuối.
      const transform = banner ? getComputedStyle(banner).transform : "none"
      const shift = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42
      const h = banner ? Math.max(min, banner.getBoundingClientRect().bottom - shift - top + 10) : min + 36
      col.style.setProperty("--band-h", `${Math.round(h)}px`)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    const ro = new ResizeObserver(schedule)
    ro.observe(col)
    ro.observe(scroller)
    const mo = new MutationObserver(schedule)
    mo.observe(scroller, { childList: true, subtree: true })
    scroller.addEventListener("scroll", schedule, { passive: true })
    // Đo lại khi hiệu ứng vào trang kết thúc (không đổi kích thước/DOM nên ResizeObserver/MutationObserver không báo).
    scroller.addEventListener("animationend", schedule)
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      mo.disconnect()
      scroller.removeEventListener("scroll", schedule)
      scroller.removeEventListener("animationend", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [columnRef, scrollRef, enabled])
}

export function ShellBand() {
  return (
    <div aria-hidden="true" data-slot="shell-band" className="shell-band">
      <div className="shell-band-dots" />
      <div className="shell-band-ring" />
      <div className="shell-band-dash" />
      <div className="shell-band-blob -top-16 left-[38%] bg-cyan-300" />
      <div className="shell-band-blob -bottom-24 -left-10 bg-sky-400" />
      <svg className="shell-band-wave" viewBox="0 0 1200 70" preserveAspectRatio="none">
        {BAND_WAVES.map((w) => (
          <path key={w.d} d={w.d} fill={w.fill} />
        ))}
      </svg>
    </div>
  )
}

function AppShell({ sidebar, mobileSidebar, mobileSidebarOpen = false, onMobileSidebarClose, header, children, className }: AppShellProps) {
  const [scrolled, setScrolled] = React.useState(false)
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const columnRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  // Giao diện kính (mặc định) hay phẳng sáng — người dùng chọn ở thanh trên (lib/ui-theme.ts).
  const glass = useGlassUi()
  useShellBand(columnRef, scrollRef, !glass)

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

      <div ref={columnRef} className="relative flex min-w-0 flex-1 flex-col">
        {!glass && <ShellBand />}
        <div className={cn("contents", glass ? "shell-inverse" : "on-band")}>{header}</div>
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
            ref={scrollRef}
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
/** Góc lõm của tab giao diện phẳng: cùng màu nền trang (`page`). */
const FLAT_TAB_CORNERS = cn(
  "before:pointer-events-none before:absolute before:right-0 before:bottom-full before:size-4 before:bg-[radial-gradient(circle_at_0_0,transparent_15.5px,var(--color-page)_16px)]",
  "after:pointer-events-none after:absolute after:top-full after:right-0 after:size-4 after:bg-[radial-gradient(circle_at_0_100%,transparent_15.5px,var(--color-page)_16px)]"
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
  const tab = useActiveTab(navRef)
  // Kính: tab kính nối tấm nội dung. Phẳng: sidebar nền gradient chữ trắng (`.on-band`), tab cùng nền trang nối vùng nội dung.
  const glass = useGlassUi()
  return (
    <aside
      data-slot="app-sidebar"
      data-collapsed={collapsed || undefined}
      className={cn(
        "group/sidebar relative z-20 flex h-full flex-none flex-col overflow-hidden transition-[width] duration-200 ease-out",
        collapsed ? "w-18" : "w-62",
        !glass && "on-band",
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
              "pointer-events-none absolute right-0 left-3 hidden lg:block",
              tab.animate && "transition-[top,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            )}
            // Dùng `top` thay vì transform: transform làm `background-attachment: fixed` của nền tab (flat-backdrop) mất hiệu lực
            // → vệt sáng góc và lưới chấm vẽ theo khung tab, lệch với vùng nội dung (hiện thành đường mờ ở chỗ nối).
            style={{ height: tab.height, top: tab.top }}
          >
            {glass ? (
              <>
                {/* Thân tab + đoạn nối 16px cuối (mang 2 góc lõm) chỉ là nền kính; viền là một nét SVG (tabOutline). */}
                <span className="liquid-tab absolute inset-y-0 right-4 left-0 rounded-l-[10px] bg-panel" />
                <span className={cn("liquid-tab-joint absolute inset-y-0 right-0 w-4 bg-panel", TAB_CORNERS)} />
                <svg className="absolute -top-4 left-0 overflow-visible" width={tab.width} height={tab.height + 32} fill="none">
                  <path d={tabOutline(tab.width, tab.height)} stroke="var(--glass-rim)" strokeWidth={1} />
                </svg>
              </>
            ) : (
              // Phẳng: tab cùng nền trang (lưới chấm cố định theo khung nhìn nên khớp chấm với vùng nội dung), bo trái 14px,
              // kéo sát mép phải sidebar; 2 góc lõm 16px trên/dưới cùng màu nền trang → nối liền vùng nội dung.
              <span className={cn("flat-backdrop absolute inset-y-0 right-0 left-0 rounded-l-control", FLAT_TAB_CORNERS)} />
            )}
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
      "relative z-1 flex flex-none items-center gap-3 rounded-[12px] text-sm whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[18px] [&_svg]:flex-none",
      glass ? "h-10 px-[15px]" : "h-11 px-2.5",
      active
        ? cn("font-semibold text-accent-foreground", glass ? "bg-card shadow-nav" : "bg-accent", ACTIVE_TAB)
        // Phẳng (sidebar gradient): rê chuột chỉ phủ lớp trắng rất mỏng kéo sát mép phải sidebar (liền như tab đang chọn) + chữ trắng;
        // ô icon sáng lên, chữ nhích nhẹ sang phải.
        : cn("text-text-secondary", !glass && "group/nav hover:bg-white/[.08] hover:text-foreground lg:-mr-3 lg:rounded-r-none")
    ),
    children: (
      <>
        {glass ? (
          icon
        ) : (
          // Ô biểu tượng 28px: mục đang chọn nền gradient chữ trắng.
          <span
            className={cn(
              "flex size-7 flex-none items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-brand-gradient text-white shadow-brand"
                : "text-muted-foreground duration-200 group-hover/nav:bg-white/15 group-hover/nav:text-foreground"
            )}
          >
            {icon}
          </span>
        )}
        {!collapsed && (
          <span className={cn("flex-1 truncate", !glass && !active && "transition-transform duration-200 ease-out group-hover/nav:translate-x-0.5 motion-reduce:transition-none")}>{label}</span>
        )}
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
