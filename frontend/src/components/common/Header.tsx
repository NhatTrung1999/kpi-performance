import { Bell, Menu, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { MainLayoutContext } from "@/layouts/MainLayout";
import { getCurrentUser, initialsOf } from "@/lib/session";
import { metaOf } from "@/routes/config";

const PERIODS = ["month", "quarter", "year"] as const;

export const PeriodTabs = ({ className }: { className?: string }) => {
  const { t } = useTranslation(["common", "nav"]);
  return (
  <div role="group" aria-label={t("period.label")} className={cn("flex gap-0.5 rounded-[10px] bg-muted p-[3px]", className)}>
    {PERIODS.map((p) => (
      <button
        key={p}
        type="button"
        aria-pressed={p === "quarter"}
        className={
          p === "quarter"
            ? "flex-1 rounded-lg bg-card px-3.5 py-1.5 font-semibold text-foreground shadow-sm"
            : "flex-1 rounded-lg px-3.5 py-1.5 font-medium text-muted-foreground"
        }
      >
        {t(`period.${p}`)}
      </button>
    ))}
  </div>
  );
};

export const SearchBox = ({ className }: { className?: string }) => {
  const { t } = useTranslation(["common", "nav"]);
  return <Input type="search" placeholder={t("searchPlaceholder")} aria-label={t("search")} startIcon={<Search />} className={className} />;
};

/** Bộ lọc kỳ + tìm kiếm cho mobile, theo cấu hình route (ẩn ở trang không cần). */
export const MobileToolbar = () => {
  const toolbar = metaOf(useLocation().pathname)?.toolbar;
  if (!toolbar?.period && !toolbar?.search) return null;
  return (
    <div className="flex flex-col gap-3 lg:hidden">
      {toolbar.period && <PeriodTabs className="[&>button]:py-2" />}
      {toolbar.search && <SearchBox className="h-11 pl-9" />}
    </div>
  );
};

/** `title` ghi đè tiêu đề lấy từ cấu hình route. */
const Header = ({ title }: { title?: string }) => {
  const { t } = useTranslation(["common", "nav"]);
  const ctx = useOutletContext<MainLayoutContext | null>();
  const meta = metaOf(useLocation().pathname);
  const toolbar = meta?.toolbar;
  const user = getCurrentUser();
  return (
    <header className="sticky top-0 z-20 flex h-14 flex-none items-center gap-1 border-b border-border bg-card pr-2 pl-1 lg:h-16 lg:gap-4 lg:px-8">
      <Button variant="ghost" size="icon-lg" aria-label={t("openMenu")} onClick={ctx?.openMenu} className="size-11 lg:hidden">
        <Menu />
      </Button>
      <h1 className="flex-1 text-[17px] font-semibold lg:text-xl">{title ?? (meta ? t(`nav:${meta.title}`) : "")}</h1>
      {toolbar?.period && <PeriodTabs className="hidden lg:flex" />}
      {toolbar?.search && (
        <div className="hidden w-70 lg:block">
          <SearchBox className="h-9 pl-9" />
        </div>
      )}
      <div className="flex items-center gap-1">
        <div className="relative">
          <Button variant="ghost" size="icon-lg" aria-label={t("notifications")} className="size-11 lg:size-9">
            <Bell />
          </Button>
          <span className="absolute top-1.75 right-2 size-2 rounded-full border-2 border-card bg-danger-text" />
        </div>
        <ThemeToggle />
      </div>
      <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground lg:ml-0 lg:size-9 lg:text-[13px]">
        {initialsOf(user.name)}
      </div>
    </header>
  );
};

export default Header;
