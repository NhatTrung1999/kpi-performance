import { useEffect, useRef, useState } from "react";
import { Bell, Keyboard, LogOut, Menu, Moon, Search, Settings, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { AccountMenu } from "@/components/ui/account-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useShell } from "@/layouts/shell-context";
import { cn } from "@/lib/utils";
import { getCurrentUser, initialsOf, portalOf } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { canAccess, metaOf } from "@/routes/config";

const PERIODS = ["month", "quarter", "year"] as const;
type Period = (typeof PERIODS)[number];

/** Bộ lọc kỳ Tháng/Quý/Năm (hiện chỉ đổi giao diện, chưa lọc dữ liệu). */
export const PeriodTabs = ({ className, size = "default" }: { className?: string; size?: "default" | "lg" }) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("quarter");
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

/** Bộ lọc kỳ + tìm kiếm cho mobile, theo cấu hình route (ẩn ở trang không cần). */
export const MobileToolbar = ({ className }: { className?: string }) => {
  const toolbar = metaOf(useLocation().pathname)?.toolbar;
  if (!toolbar?.period && !toolbar?.search) return null;
  return (
    <div className={cn("flex flex-col gap-3 lg:hidden", className)}>
      {toolbar.period && <PeriodTabs size="lg" />}
      {toolbar.search && <SearchBox className="h-11 pl-9" />}
    </div>
  );
};

const iconButton = "relative size-10 rounded-lg text-text-secondary lg:size-9 lg:border-border [&_svg]:size-[18px] lg:[&_svg]:size-[18px]";

/** Thanh trên chung của trang trong: tiêu đề theo route, bộ lọc, thông báo, giao diện, menu tài khoản. */
const Header = () => {
  const { t } = useTranslation(["common", "nav"]);
  const shell = useShell();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const meta = metaOf(useLocation().pathname);
  const toolbar = meta?.toolbar;
  const user = getCurrentUser();
  const title = !meta ? "" : canAccess(meta, user.role) ? t(`nav:${meta.title}`) : t("forbidden.title");
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-20 flex h-14 flex-none items-center gap-1 border-b border-border bg-card pr-3 pl-1 lg:static lg:gap-4 lg:border-0 lg:bg-transparent lg:pr-4 lg:pl-6">
      <Button variant="ghost" size="icon-lg" aria-label={t("openMenu")} onClick={shell?.openMobileMenu} className="size-10 lg:hidden [&_svg]:size-5">
        <Menu />
      </Button>
      <h1 className="flex-1 truncate text-[17px] font-semibold lg:flex-none lg:text-lg">{title}</h1>
      {toolbar?.period && <PeriodTabs className="ml-2 hidden lg:flex" />}
      <div className="hidden flex-1 lg:block" />
      {toolbar?.search && (
        <div className="hidden w-60 lg:block xl:w-70">
          <SearchBox shortcut className="h-9 rounded-[10px] bg-card pr-3 pl-9 xl:pr-16 text-[13px] placeholder:text-placeholder" />
        </div>
      )}
      <div className="flex items-center gap-1 lg:gap-2">
        <Button variant="ghost" size="icon-lg" aria-label={t("notifications")} className={iconButton}>
          <Bell strokeWidth={1.8} />
          <span aria-hidden="true" className="absolute top-2 right-2.5 size-2 rounded-full border-2 border-card bg-danger lg:top-1.75 lg:right-2 lg:border-shell" />
        </Button>
        <Button variant="ghost" size="icon-lg" aria-label={isDark ? t("theme.toLight") : t("theme.toDark")} onClick={toggle} className={iconButton}>
          {isDark ? <Sun strokeWidth={1.8} /> : <Moon strokeWidth={1.8} />}
        </Button>
      </div>
      <AccountMenu
        className="ml-1 lg:ml-0"
        avatarSize="md"
        name={user.name}
        initials={initialsOf(user.name)}
        title={user.title || (user.roleKnown ? portalOf(user.role) : t("unknownRole"))}
        email={user.email || undefined}
        triggerLabel={t("shell.accountMenu")}
        items={[
          { key: "profile", label: t("shell.profile"), icon: <Settings strokeWidth={1.8} />, onSelect: () => navigate("/profile") },
          { key: "shortcuts", label: t("shell.shortcuts"), icon: <Keyboard strokeWidth={1.8} />, shortcut: t("shortcuts.keys.showShortcuts"), onSelect: () => shell?.openShortcuts() },
          { key: "logout", label: t("shell.logout"), icon: <LogOut strokeWidth={1.8} />, tone: "danger", separatorBefore: true, onSelect: () => shell?.requestLogout() },
        ]}
      />
    </header>
  );
};

export default Header;
