import { Bell, Menu, Search } from "lucide-react";
import { useLocation, useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { MainLayoutContext } from "@/layouts/MainLayout";
import { getCurrentUser, initialsOf } from "@/lib/session";
import { metaOf } from "@/routes/config";

export const PeriodTabs = ({ className }: { className?: string }) => (
  <div role="group" aria-label="Kỳ đánh giá" className={cn("flex gap-0.5 rounded-[10px] bg-muted p-[3px]", className)}>
    {["Tháng", "Quý", "Năm"].map((p) => (
      <button
        key={p}
        type="button"
        aria-pressed={p === "Quý"}
        className={
          p === "Quý"
            ? "flex-1 rounded-lg bg-card px-3.5 py-1.5 font-semibold text-foreground shadow-sm"
            : "flex-1 rounded-lg px-3.5 py-1.5 font-medium text-muted-foreground"
        }
      >
        {p}
      </button>
    ))}
  </div>
);

export const SearchBox = ({ className }: { className?: string }) => (
  <Input type="search" placeholder="Tìm mục tiêu, đánh giá…" aria-label="Tìm kiếm" startIcon={<Search />} className={className} />
);

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
  const ctx = useOutletContext<MainLayoutContext | null>();
  const meta = metaOf(useLocation().pathname);
  const toolbar = meta?.toolbar;
  const user = getCurrentUser();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-border bg-card pr-2 pl-1 lg:h-16 lg:gap-4 lg:px-8">
      <Button variant="ghost" size="icon-lg" aria-label="Mở menu" onClick={ctx?.openMenu} className="size-11 lg:hidden">
        <Menu />
      </Button>
      <h1 className="flex-1 text-[17px] font-semibold lg:text-xl">{title ?? meta?.title ?? ""}</h1>
      {toolbar?.period && <PeriodTabs className="hidden lg:flex" />}
      {toolbar?.search && (
        <div className="hidden w-70 lg:block">
          <SearchBox className="h-9 pl-9" />
        </div>
      )}
      <div className="flex items-center gap-1">
        <div className="relative">
          <Button variant="ghost" size="icon-lg" aria-label="Thông báo" className="size-11 lg:size-9">
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
