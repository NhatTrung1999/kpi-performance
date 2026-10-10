import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** `lg` = ô nhập của trang đăng nhập (cao 48px, bo 14px). */
  size?: "default" | "lg"
  /** Icon đặt bên trái ô (tự chừa padding). */
  startIcon?: React.ReactNode
  /** Phần tử bên phải (vd. nút hiện mật khẩu); đặt `className="pr-12"` cho ô nếu cần. */
  endAdornment?: React.ReactNode
}

const sizeClass = {
  default: "",
  lg: cn(
    "h-12 rounded-control border-border bg-card px-2.5 text-body text-foreground shadow-field",
    "placeholder:text-placeholder transition-[border-color,box-shadow] duration-200",
    "hover:border-border-strong focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:ring-offset-0",
    "aria-[invalid=true]:border-danger-text aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-danger-text/10",
    "disabled:opacity-55 dark:bg-card dark:shadow-none dark:focus-visible:ring-brand/20",
    "dark:aria-[invalid=true]:border-danger-text dark:aria-[invalid=true]:ring-danger-text/15"
  ),
}

function Input({ className, type, size = "default", startIcon, endAdornment, ...props }: InputProps) {
  const field = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        sizeClass[size],
        startIcon && "pl-11",
        className
      )}
      {...props}
    />
  )
  if (!startIcon && !endAdornment) return field
  return (
    <div className="relative">
      {startIcon && (
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[15px] -translate-y-1/2 text-muted-foreground [&>svg]:size-[18px]">
          {startIcon}
        </span>
      )}
      {field}
      {endAdornment}
    </div>
  )
}

export { Input }
export type { InputProps }
