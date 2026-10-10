import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiPillProps {
  left: string;
  top: string;
  children: ReactNode;
  className?: string;
}

/** Điểm sáng trên đường biểu đồ + nhãn kính mờ nhấp nhô phía trên. */
export function KpiPill({ left, top, children, className }: KpiPillProps) {
  return (
    <div aria-hidden="true" className="absolute z-30" style={{ left, top }}>
      <span className="absolute -ml-[7px] -mt-[7px] h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_0_4px_rgba(99,102,241,.35),0_0_24px_6px_rgba(99,102,241,.55)]" />
      <div className={cn("animate-bob", className)}>
        <div className="flex -translate-x-1/2 -translate-y-[130%] items-center gap-2 whitespace-nowrap rounded-full border border-white/80 bg-white/75 py-2 pl-2 pr-3.5 text-gray-900 shadow-[0_24px_60px_-24px_rgba(49,46,129,.35)] backdrop-blur-lg dark:border-white/10 dark:bg-[#101018]/70 dark:text-gray-100 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)]">
          {children}
        </div>
      </div>
    </div>
  );
}
