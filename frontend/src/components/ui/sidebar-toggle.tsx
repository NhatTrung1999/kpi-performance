import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SidebarToggleProps = {
  collapsed: boolean
  onToggle: () => void
  /** Nhãn/tooltip theo trạng thái; ứng dụng truyền chuỗi đã dịch. */
  labels?: { collapse: string; expand: string }
  /** Phím tắt hiện trong tooltip. */
  shortcut?: string
  className?: string
}

const DEFAULT_LABELS = { collapse: "Collapse sidebar", expand: "Expand sidebar" }

/**
 * Nút đóng/mở sidebar cạnh logo: nút kính tròn (`liquid-glass`, cùng kiểu nút ngôn ngữ trên thanh trên — sidebar nằm trong
 * `.shell-inverse` nên từ lg ăn kiểu kính), icon theo trạng thái: đang mở → "thu vào" (ChevronsLeft «), đang thu → "mở ra"
 * (ChevronsRight »). Icon hơi mờ, sáng lên khi rê chuột lên sidebar hoặc focus bàn phím.
 */
function SidebarToggle({ collapsed, onToggle, labels = DEFAULT_LABELS, shortcut = "Ctrl B", className }: SidebarToggleProps) {
  const label = collapsed ? labels.expand : labels.collapse
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        type="button"
        data-slot="sidebar-toggle"
        aria-label={label}
        aria-expanded={!collapsed}
        onClick={onToggle}
        className={cn(
          "liquid-glass flex size-8 flex-none items-center justify-center rounded-full border border-border text-text-secondary outline-none transition-[color,transform] duration-150 ease-out",
          "group-hover/sidebar:text-foreground hover:text-foreground active:scale-95 focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        {collapsed ? (
          <ChevronsRight aria-hidden="true" className="size-[18px]" strokeWidth={2} />
        ) : (
          <ChevronsLeft aria-hidden="true" className="size-[18px]" strokeWidth={2} />
        )}
      </button>
    </Tooltip>
  )
}

export { SidebarToggle }
export type { SidebarToggleProps }
