import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert, X } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * Toaster dùng chung toàn hệ thống — MỌI style toast nằm ở đây.
 * Thay file do `npx shadcn@latest add sonner` sinh ra (bản gốc phụ thuộc next-themes).
 * `unstyled` tắt style mặc định của Sonner; giao diện lấy hoàn toàn từ classNames bên dưới.
 */

function IconBadge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span aria-hidden="true" className={cn("grid h-8 w-8 place-items-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]", className)}>
      {children}
    </span>
  );
}

const icons: ToasterProps["icons"] = {
  error: (
    <IconBadge className="bg-red-50 text-red-600 shadow-[0_0_0_4px_rgba(239,68,68,.08),0_0_18px_rgba(239,68,68,.35)] dark:bg-red-500/15 dark:text-red-400 dark:shadow-[0_0_0_4px_rgba(248,113,113,.08),0_0_22px_rgba(248,113,113,.45)]">
      <CircleAlert strokeWidth={2} />
    </IconBadge>
  ),
  warning: (
    <IconBadge className="bg-amber-50 text-amber-600 shadow-[0_0_0_4px_rgba(245,158,11,.08),0_0_18px_rgba(245,158,11,.35)] dark:bg-amber-400/15 dark:text-amber-300 dark:shadow-[0_0_0_4px_rgba(252,211,77,.08),0_0_22px_rgba(252,211,77,.4)]">
      <TriangleAlert strokeWidth={2} />
    </IconBadge>
  ),
  success: (
    <IconBadge className="bg-emerald-50 text-emerald-600 shadow-[0_0_0_4px_rgba(16,185,129,.08),0_0_18px_rgba(16,185,129,.35)] dark:bg-emerald-400/15 dark:text-emerald-300 dark:shadow-[0_0_0_4px_rgba(110,231,183,.08),0_0_22px_rgba(110,231,183,.4)]">
      <CircleCheck strokeWidth={2} />
    </IconBadge>
  ),
  info: (
    <IconBadge className="bg-indigo-50 text-indigo-600 shadow-[0_0_18px_rgba(99,102,241,.3)] dark:bg-indigo-400/15 dark:text-indigo-300">
      <Info strokeWidth={2} />
    </IconBadge>
  ),
  loading: (
    <IconBadge className="bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
      <Loader2 strokeWidth={2} className="animate-spin" />
    </IconBadge>
  ),
  close: <X aria-hidden="true" className="h-4 w-4" />,
};

export function Toaster({ label = "Notifications", closeLabel = "Dismiss notification", ...props }: ToasterProps & { label?: string; closeLabel?: string }) {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme}
      position="top-right"
      closeButton
      visibleToasts={3}
      gap={10}
      offset={20}
      containerAriaLabel={label}
      icons={icons}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: closeLabel,
        classNames: {
          toast: cn(
            "group pointer-events-auto relative flex w-[var(--width)] items-start gap-3 rounded-control border p-4 pr-14 font-login",
            "border-border bg-card text-foreground shadow-toast",
            "dark:bg-card/75 dark:backdrop-blur-xl dark:backdrop-saturate-150"
          ),
          icon: "!m-0 !h-8 !w-8 shrink-0",
          content: "flex min-w-0 flex-1 flex-col gap-0.5 pt-[5px]",
          title: "text-sm font-semibold leading-snug tracking-[-0.005em]",
          description: "text-label leading-snug text-muted-foreground",
          actionButton: cn(
            "!ml-1 !mt-[2px] !h-8 shrink-0 self-start !rounded-[10px] !border-0 !px-3.5 !text-label !font-semibold !text-white",
            "!bg-brand-gradient shadow-[0_8px_18px_-8px_rgba(79,70,229,.6)]",
            "transition-all duration-200 hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-card"
          ),
          cancelButton: "!rounded-[10px] !bg-muted !text-text-secondary dark:!bg-white/10 dark:!text-gray-200",
          closeButton: cn(
            "!absolute !left-auto !right-4 !top-4 !flex !h-8 !w-8 !items-center !justify-center !p-0 !translate-x-0 !translate-y-0 !rounded-[10px] !border-0 !bg-transparent !shadow-none !outline-none",
            "!text-placeholder transition-colors hover:!border-0 hover:!bg-muted hover:!text-text-secondary focus-visible:!ring-2 focus-visible:!ring-brand",
            "dark:hover:!bg-white/10 dark:hover:!text-gray-200"
          ),
        },
      }}
      {...props}
    />
  );
}
