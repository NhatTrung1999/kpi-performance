import * as React from "react"
import { cn } from "@/lib/utils"

/*
 * Bố cục dùng chung cho trang dạng bảng.
 * - Từ lg: MainLayout cao đúng màn hình, PageShell giãn hết chỗ còn lại, TableCard lấp phần dư
 *   và chỉ TableCardBody cuộn (một vùng cuộn duy nhất).
 * - Dưới lg: cuộn cả trang, TableCardBody có chiều cao tối đa và cuộn ngang/dọc trong khung riêng.
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

/** Card danh sách: giãn hết chiều cao còn lại từ lg, không nhỏ hơn 20rem để không bị ép bẹp. */
function TableCard({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="table-card"
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] border border-border bg-card lg:min-h-80 lg:flex-1",
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
