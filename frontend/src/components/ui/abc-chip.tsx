import * as React from "react"
import { cn } from "@/lib/utils"

/*
 * Chip một mức bình bầu A-B-C (vd. "2C"). Màu theo mức, KHÔNG theo màu của dòng chứa nó.
 * Mặc định: C ≥ 3 lần → đỏ nhạt, C = 2 lần → cam nhạt, còn lại (1C, A, B) → trung tính.
 * Ứng dụng có quy tắc riêng thì truyền `tone` (vd. tính từ cấu hình quy tắc ABC).
 */

type AbcChipTone = "danger" | "warning" | "neutral"

type AbcChipProps = Omit<React.ComponentProps<"span">, "children"> & {
  count: number
  grade: string
  tone?: AbcChipTone
}

const TONE: Record<AbcChipTone, string> = {
  danger: "bg-danger-soft text-danger-text",
  warning: "bg-warning-soft text-warning-text",
  neutral: "bg-muted text-text-secondary",
}

const defaultTone = (count: number, grade: string): AbcChipTone =>
  grade !== "C" ? "neutral" : count >= 3 ? "danger" : count === 2 ? "warning" : "neutral"

function AbcChip({ count, grade, tone, className, ...props }: AbcChipProps) {
  return (
    <span
      data-slot="abc-chip"
      className={cn(
        "inline-flex h-[18px] flex-none items-center rounded-full px-1.5 text-[11px] leading-none font-semibold whitespace-nowrap tabular-nums",
        TONE[tone ?? defaultTone(count, grade)],
        className
      )}
      {...props}
    >
      {count}
      {grade}
    </span>
  )
}

export { AbcChip }
export type { AbcChipProps, AbcChipTone }
