import * as React from "react"
import { cn } from "@/lib/utils"

/** Phím tắt dạng chip nhỏ, vd. `Ctrl B`, `?`. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-[18px] items-center rounded-[5px] border border-border px-1.5 font-sans text-[11px] leading-none font-semibold whitespace-nowrap text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
