import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Bề mặt kính mờ — CHỈ dùng ở trang đăng nhập / màn hình giới thiệu.
 * Trang nội bộ dùng `Card` phẳng (xem docs/design-system.md).
 */
const glassCardVariants = cva("relative text-sm text-card-foreground", {
  variants: {
    variant: {
      panel: "",
      /** Nhãn nhỏ dạng viên thuốc (vd. KpiPill). */
      pill: "",
    },
    /** `always`: luôn là kính. `sm`: trong suốt trên mobile, thành kính từ breakpoint sm. */
    glass: {
      always: "",
      sm: "",
    },
  },
  compoundVariants: [
    {
      variant: "panel",
      glass: "always",
      className:
        "rounded-hero border border-glass-border bg-glass shadow-glass backdrop-blur-2xl backdrop-saturate-150",
    },
    {
      variant: "panel",
      glass: "sm",
      className:
        "border-0 bg-transparent shadow-none sm:rounded-hero sm:border sm:border-glass-border sm:bg-glass sm:shadow-glass sm:backdrop-blur-2xl sm:backdrop-saturate-150",
    },
    {
      variant: "pill",
      glass: "always",
      className: "rounded-full border border-glass-border bg-glass shadow-glass-sm backdrop-blur-lg",
    },
  ],
  defaultVariants: { variant: "panel", glass: "always" },
})

function GlassCard({
  className,
  variant,
  glass,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof glassCardVariants>) {
  return (
    <div
      data-slot="glass-card"
      className={cn(glassCardVariants({ variant, glass }), className)}
      {...props}
    />
  )
}

export { GlassCard, glassCardVariants }
