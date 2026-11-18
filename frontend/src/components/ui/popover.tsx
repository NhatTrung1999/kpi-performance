import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"
import { useGlassPopup } from "@/hooks/use-is-desktop"

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
  const glass = useGlassPopup()
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={16} collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "none" }} className="z-50">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "flex max-h-[min(22.5rem,var(--available-height))] w-(--anchor-width) max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border bg-popover text-popover-foreground shadow-toast outline-none",
            // Mở: mờ → rõ, phóng nhẹ từ phía ô neo và trượt 6px ra khỏi ô neo (lật lên trên thì trượt ngược); đóng nhanh hơn mở.
            "origin-(--transform-origin) transition-[opacity,scale,translate] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            "data-starting-style:scale-[.96] data-starting-style:opacity-0 data-ending-style:scale-[.97] data-ending-style:opacity-0 data-ending-style:duration-150 data-ending-style:ease-in",
            "data-[side=bottom]:data-starting-style:-translate-y-1.5 data-[side=top]:data-starting-style:translate-y-1.5 data-[side=bottom]:data-ending-style:-translate-y-1 data-[side=top]:data-ending-style:translate-y-1",
            glass,
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
