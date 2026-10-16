import { PanelLeft } from "lucide-react"
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
 * Nút đóng/mở sidebar cạnh logo. Mờ khi chuột không ở trên sidebar (nhóm `group/sidebar` của AppSidebar),
 * rõ khi rê chuột hoặc focus bàn phím.
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
          "flex size-7 flex-none items-center justify-center rounded-lg text-text-secondary opacity-40 outline-none transition-[opacity,background-color,color] duration-150 ease-out",
          "group-hover/sidebar:opacity-100 hover:bg-foreground/7 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <PanelLeft aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      </button>
    </Tooltip>
  )
}

export { SidebarToggle }
export type { SidebarToggleProps }
