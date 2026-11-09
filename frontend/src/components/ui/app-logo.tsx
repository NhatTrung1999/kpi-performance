import { ChartLine } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Logo ứng dụng kiểu kính mờ: ô kính trong (làm nhòe nền, viền sáng), icon màu thương hiệu (`.app-logo` trong index.css). Dùng chung cho sidebar, thanh trên (vai trò không có sidebar) và trang đăng nhập.
 * Thay icon bằng logo công ty khi có.
 */
function AppLogo({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" data-slot="app-logo" className={cn("app-logo grid size-8 flex-none place-items-center rounded-[10px]", className)}>
      <ChartLine className="size-[17px]" strokeWidth={2.2} />
    </div>
  )
}

export { AppLogo }
