import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { PERIODS, usePeriodStore } from "@/stores/period";

/*
 * Bộ lọc kỳ Tháng/Quý/Năm và ô tìm kiếm của trang Overview cũ (dành cho nhân viên).
 * Không còn dùng sau khi bỏ các trang nhân viên — giữ lại chờ quyết định xóa (chỉ pages/dashboard import).
 */

/** Bộ lọc kỳ Tháng/Quý/Năm — state chung (usePeriodStore) nên desktop và mobile luôn đồng bộ; trang đọc `period` để lọc dữ liệu. */
export const PeriodTabs = ({ className, size = "default" }: { className?: string; size?: "default" | "lg" }) => {
  const { t } = useTranslation();
  const period = usePeriodStore((s) => s.period);
  const setPeriod = usePeriodStore((s) => s.setPeriod);
  return (
    <div role="group" aria-label={t("period.label")} className={cn("flex gap-0.5 rounded-[10px] bg-foreground/6 p-[3px]", className)}>
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={p === period}
          onClick={() => setPeriod(p)}
          className={cn(
            "flex flex-1 items-center justify-center rounded-lg px-3 text-[13px] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            size === "lg" ? "h-9" : "h-7.5",
            p === period ? "bg-card font-semibold text-foreground shadow-sm" : "font-medium text-muted-foreground hover:text-foreground"
          )}
        >
          {t(`period.${p}`)}
        </button>
      ))}
    </div>
  );
};

/** Ô tìm kiếm; Ctrl/⌘+K đưa con trỏ vào ô (chỉ khi ô đang hiển thị). */
export const SearchBox = ({ className, shortcut = false }: { className?: string; shortcut?: boolean }) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && ref.current?.offsetParent) {
        e.preventDefault();
        ref.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);
  return (
    <Input
      ref={ref}
      type="search"
      placeholder={t("searchPlaceholder")}
      aria-label={t("search")}
      startIcon={<Search />}
      endAdornment={shortcut ? <Kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 xl:inline-flex">{t("shortcuts.keys.search")}</Kbd> : undefined}
      className={className}
    />
  );
};

/** Bộ lọc kỳ + tìm kiếm cho mobile. */
export const MobileToolbar = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col gap-3 lg:hidden", className)}>
    <PeriodTabs size="lg" />
    <SearchBox className="h-11 pl-9" />
  </div>
);

