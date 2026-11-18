import { useMemo } from "react";
import { LogOut, Menu } from "lucide-react";
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
        "sticky top-0 z-20 flex h-14 flex-none items-center gap-2 pr-3 pl-4 lg:gap-4 lg:pr-4 lg:pl-6",
        // Kính: dải mờ tối dính đầu trang trên điện thoại. Phẳng: chữ trắng trên dải gradient đầu trang (AppShell `.on-band`) —
        // điện thoại tự có nền gradient (dính đầu trang khi cuộn), từ lg trong suốt, cao hơn chút và lùi vào theo mép dải.
        glass
          ? "border-b border-border bg-shell/80 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none"
          : "bg-brand-gradient lg:relative lg:top-auto lg:mt-3 lg:h-16 lg:bg-none lg:pr-7 lg:pl-9"
      )}
    >
      {withSidebar ? (
        <>
          <Button variant="ghost" size="icon-lg" aria-label={t("openMenu")} onClick={shell?.openMobileMenu} className="-ml-3 size-10 lg:hidden [&_svg]:size-5">
            <Menu />
          </Button>
          {/* Điện thoại: tiêu đề đã có to trên băng tiêu đề trang → chỉ để cho trình đọc màn hình, nhường chỗ cho Pill + nút. */}
          <h1 className="truncate text-[17px] font-semibold max-sm:sr-only lg:text-[15px]">{title}</h1>
        </>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">
          <AppLogo />
          <span className="truncate text-[15px] font-bold tracking-[-0.01em]">{t("appName")}</span>
          <h1 className="sr-only">{title}</h1>
        </div>
      )}
      {periodLabel && (
        <Pill tone="brand" className="flex-none max-sm:hidden">
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
          { key: "logout", label: t("shell.logout"), icon: <LogOut strokeWidth={1.8} />, tone: "danger", onSelect: () => shell?.requestLogout() },
        ]}
      />
    </header>
  );
};

export default Header;
