import { useMemo } from "react";
import { Keyboard, LogOut, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountMenu } from "@/components/ui/account-menu";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/metric-card";
import { useShell } from "@/layouts/shell-context";
import { getQuarterInfo } from "@/lib/quarter";
import { useGlassUi } from "@/lib/ui-theme";
import { cn } from "@/lib/utils";
import { initialsOf, portalOf, useCurrentUser } from "@/lib/session";
import { canAccess, metaOf, ROLE_GATING } from "@/routes/config";
import { usePagePeriodStore } from "@/stores/page-period";

type HeaderProps = {
  /** Có sidebar (Admin): hiện tiêu đề trang + nút mở menu mobile. Không có (CQ, BLĐ): hiện logo + tên ứng dụng. */
  withSidebar: boolean;
};

/** Thanh trên chung của trang trong: tiêu đề/logo, quý hiện tại, chuyển ngôn ngữ, menu tài khoản. */
const Header = ({ withSidebar }: HeaderProps) => {
  const { t } = useTranslation(["common", "nav"]);
  const shell = useShell();
  const meta = metaOf(useLocation().pathname);
  const user = useCurrentUser();
  const glass = useGlassUi();
  const title = !meta ? "" : canAccess(meta, user.role) ? t(`nav:${meta.title}`) : t("forbidden.title");
  const quarter = useMemo(() => {
    const q = getQuarterInfo(new Date());
    return t("quarterLabel", { quarter: q.quarter, year: q.startDate.slice(0, 4) });
  }, [t]);
  // Trang có kỳ riêng (vd. "Đợt 10/2026") tự đặt nhãn; chưa có dữ liệu thì chưa hiện Pill.
  const pageLabel = usePagePeriodStore((s) => s.label);
  const periodLabel = meta?.period === false ? null : meta?.period === "page" ? pageLabel : quarter;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 flex-none items-center gap-2 border-b border-border pr-3 pl-4 lg:static lg:gap-4 lg:pr-4 lg:pl-6",
        // Trên điện thoại là dải mờ dính đầu trang (kính: tối; phẳng: xanh nhạt); từ lg trong suốt trên nền khung/nền trang.
        glass ? "bg-shell/80 backdrop-blur-xl lg:border-0 lg:bg-transparent lg:backdrop-blur-none" : "bg-page/80 backdrop-blur-xl lg:border-0 lg:bg-transparent lg:backdrop-blur-none"
      )}
    >
      {withSidebar ? (
        <>
          <Button variant="ghost" size="icon-lg" aria-label={t("openMenu")} onClick={shell?.openMobileMenu} className="-ml-3 size-10 lg:hidden [&_svg]:size-5">
            <Menu />
          </Button>
          <h1 className="truncate text-[17px] font-semibold lg:text-[15px]">{title}</h1>
        </>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">
          <AppLogo />
          <span className="truncate text-[15px] font-bold tracking-[-0.01em]">{t("appName")}</span>
          <h1 className="sr-only">{title}</h1>
        </div>
      )}
      {periodLabel && (
        <Pill tone="brand" className="flex-none">
          {periodLabel}
        </Pill>
      )}
      <div className="flex-1" />
      <ThemeToggle />
      <LanguageSwitch className="liquid-glass" />
      <AccountMenu
        avatarSize="md"
        name={user.name}
        initials={initialsOf(user.name)}
        title={user.title || (ROLE_GATING ? (user.roleKnown ? portalOf(user.role) : t("unknownRole")) : undefined)}
        email={user.email || undefined}
        triggerLabel={t("shell.accountMenu")}
        items={[
          { key: "shortcuts", label: t("shell.shortcuts"), icon: <Keyboard strokeWidth={1.8} />, shortcut: t("shortcuts.keys.showShortcuts"), onSelect: () => shell?.openShortcuts() },
          { key: "logout", label: t("shell.logout"), icon: <LogOut strokeWidth={1.8} />, tone: "danger", separatorBefore: true, onSelect: () => shell?.requestLogout() },
        ]}
      />
    </header>
  );
};

export default Header;
