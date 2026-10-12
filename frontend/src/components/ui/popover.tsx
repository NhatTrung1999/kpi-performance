import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "side" | "align" | "sideOffset">

/**
 * Popover nổi trên toàn trang: render qua portal vào <body>, z-50 nên không bị card/khung cha che.
 * Rộng bằng phần tử neo (ô chọn); đặt `min-w-*` để có chiều rộng tối thiểu.
 * Hết chỗ bên dưới thì tự lật lên trên; chiều cao tối đa theo vùng còn trống (tối đa 360px).
 */
function PopoverContent({ className, side = "bottom", align = "start", sideOffset = 8, ...props }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={16} collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "none" }} className="z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "flex max-h-[min(22.5rem,var(--available-height))] w-(--anchor-width) max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border bg-popover text-popover-foreground shadow-toast outline-none",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

/**
 * Điều hướng bàn phím trong danh sách `role="option"`: ↑/↓/Home/End di chuyển tiêu điểm
 * (↓ từ ô tìm kiếm nhảy vào mục đang chọn hoặc mục đầu). Gắn vào phần tử bao popup.
 */
function onListKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return
  const options = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')]
  if (options.length === 0) return
  const i = options.indexOf(document.activeElement as HTMLElement)
  const selected = options.findIndex((o) => o.getAttribute("aria-selected") === "true")
  let next: number
  if (e.key === "Home") next = 0
  else if (e.key === "End") next = options.length - 1
  else if (i < 0) next = e.key === "ArrowDown" ? Math.max(selected, 0) : options.length - 1
  else next = Math.min(options.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))
  e.preventDefault()
  options[next].focus()
  options[next].scrollIntoView({ block: "nearest" })
}

export { Popover, PopoverTrigger, PopoverClose, PopoverContent, onListKeyDown }
