import { useMemo } from "react";
import { Keyboard, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { AccountMenu } from "@/components/ui/account-menu";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/metric-card";
import { useShell } from "@/layouts/shell-context";
import { getQuarterInfo } from "@/lib/quarter";
import { initialsOf, portalOf, useCurrentUser } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { canAccess, metaOf, ROLE_GATING } from "@/routes/config";

const iconButton = "relative size-10 rounded-lg text-text-secondary lg:size-9 lg:border-border [&_svg]:size-[18px] lg:[&_svg]:size-[18px]";

type HeaderProps = {
  /** Có sidebar (Admin): hiện tiêu đề trang + nút mở menu mobile. Không có (CQ, BLĐ): hiện logo + tên ứng dụng. */
  withSidebar: boolean;
};

/** Thanh trên chung của trang trong: tiêu đề/logo, quý hiện tại, giao diện sáng/tối, menu tài khoản. */
const Header = ({ withSidebar }: HeaderProps) => {
  const { t } = useTranslation(["common", "nav"]);
  const shell = useShell();
  const { theme, toggle } = useTheme();
  const meta = metaOf(useLocation().pathname);
  const user = useCurrentUser();
  const title = !meta ? "" : canAccess(meta, user.role) ? t(`nav:${meta.title}`) : t("forbidden.title");
  const isDark = theme === "dark";
  const quarter = useMemo(() => {
    const q = getQuarterInfo(new Date());
    return t("quarterLabel", { quarter: q.quarter, year: q.startDate.slice(0, 4) });
  }, [t]);

  return (
    <header className="sticky top-0 z-20 flex h-14 flex-none items-center gap-2 border-b border-border bg-card pr-3 pl-4 lg:static lg:gap-4 lg:border-0 lg:bg-transparent lg:pr-4 lg:pl-6">
      {withSidebar ? (
        <>
          <Button variant="ghost" size="icon-lg" aria-label={t("openMenu")} onClick={shell?.openMobileMenu} className="-ml-3 size-10 lg:hidden [&_svg]:size-5">
            <Menu />
          </Button>
          <h1 className="truncate text-[17px] font-semibold lg:text-[15px]">{title}</h1>
        </>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">
          <div aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-brand-gradient text-[15px] font-bold text-white">
            K
          </div>
          <span className="truncate text-[15px] font-bold tracking-[-0.01em]">{t("appName")}</span>
          <h1 className="sr-only">{title}</h1>
        </div>
      )}
      <Pill tone="brand" className="flex-none">
        {quarter}
      </Pill>
      <div className="flex-1" />
      <Button variant="ghost" size="icon-lg" aria-label={isDark ? t("theme.toLight") : t("theme.toDark")} onClick={toggle} className={iconButton}>
        {isDark ? <Sun strokeWidth={1.8} /> : <Moon strokeWidth={1.8} />}
      </Button>
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
