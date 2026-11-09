import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Nút sáng/tối (thanh trên trang trong + trang đăng nhập, cạnh nút ngôn ngữ). Icon là chế độ sẽ chuyển sang. */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? t("theme.toLight") : t("theme.toDark");
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        onClick={toggle}
        className={cn(
          "liquid-glass flex size-9 flex-none items-center justify-center rounded-full border border-border bg-card text-text-secondary outline-none transition-[color,transform] duration-150 ease-out",
          "hover:text-foreground active:scale-95 focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        {isDark ? <Sun aria-hidden="true" className="size-4" strokeWidth={1.8} /> : <Moon aria-hidden="true" className="size-4" strokeWidth={1.8} />}
      </button>
    </Tooltip>
  );
}
