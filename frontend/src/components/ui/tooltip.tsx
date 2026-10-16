import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

type TooltipProps = {
  /** Nội dung gợi ý (chuỗi đã dịch). */
  content: React.ReactNode
  /** Phím tắt hiện bên phải nội dung, vd. "Ctrl B". */
  shortcut?: React.ReactNode
  /** Phần tử kích hoạt (button, link…) — phải nhận được ref và props. */
  children: React.ReactElement
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  /** Tắt tooltip (vd. sidebar đang mở rộng thì nhãn đã hiện sẵn). */
  disabled?: boolean
  delay?: number
  className?: string
}

/** Gợi ý khi rê chuột / focus bàn phím. Render qua portal nên không bị khung cha cắt. */
function Tooltip({ content, shortcut, children, side = "right", sideOffset = 10, disabled, delay = 300, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root disabled={disabled}>
      <TooltipPrimitive.Trigger render={children} delay={delay} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} className="z-50">
          <TooltipPrimitive.Popup
            data-slot="tooltip"
            className={cn(
              "flex items-center gap-2.5 rounded-lg border border-border bg-popover py-1.5 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-toast",
              shortcut ? "pr-2 pl-2.5" : "px-2.5",
              "origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0",
              className
            )}
          >
            {content}
            {shortcut && <Kbd>{shortcut}</Kbd>}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip }
export type { TooltipProps }
