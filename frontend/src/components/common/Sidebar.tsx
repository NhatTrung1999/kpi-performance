import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { AppSidebar, SidebarNavGroup, SidebarNavItem } from "@/components/ui/app-shell";
import { SidebarToggle } from "@/components/ui/sidebar-toggle";
import { useShell } from "@/layouts/shell-context";
import { useCurrentUser } from "@/lib/session";
import { canAccess, NAV_GROUP_LABEL, ROUTE_META, type NavGroup } from "@/routes/config";

const GROUPS: NavGroup[] = ["proposal", "admin"];

type SidebarProps = {
  collapsed?: boolean;
  /** Có thì là menu trượt mobile (hiện nút X, không có nút thu gọn). */
  onClose?: () => void;
  /** Gọi khi chọn một mục (mobile: đóng menu). */
  onNavigate?: () => void;
  className?: string;
};

const Sidebar = ({ collapsed = false, onClose, onNavigate, className }: SidebarProps) => {
  const { t } = useTranslation(["common", "nav"]);
  const shell = useShell();
  const { pathname } = useLocation();
  const user = useCurrentUser();
  const items = Object.entries(ROUTE_META).filter(([, m]) => m.nav && canAccess(m, user.role));

  return (
    <AppSidebar
      collapsed={collapsed}
      logo="K"
      name={t("appName")}
      toggle={
        !onClose && shell ? (
          <SidebarToggle
            collapsed={collapsed}
            onToggle={shell.toggleSidebar}
            labels={{ collapse: t("shell.collapseSidebar"), expand: t("shell.expandSidebar") }}
            shortcut={t("shortcuts.keys.toggleSidebar")}
          />
        ) : undefined
      }
      onClose={onClose}
      closeLabel={t("closeMenu")}
      navLabel={t("mainNav")}
      className={className}
    >
      {GROUPS.map((group) => {
        const groupItems = items.filter(([, m]) => m.nav!.group === group);
        if (groupItems.length === 0) return null;
        const groupKey = NAV_GROUP_LABEL[group];
        return (
          <SidebarNavGroup key={group} label={groupKey && t(`nav:groups.${groupKey}`)} collapsed={collapsed}>
            {groupItems.map(([to, meta]) => {
              const { icon: Icon, badge } = meta.nav!;
              return (
                <SidebarNavItem
                  key={to}
                  icon={<Icon aria-hidden="true" strokeWidth={1.8} />}
                  label={t(`nav:${meta.title}`)}
                  active={pathname === to || pathname.startsWith(`${to}/`)}
                  collapsed={collapsed}
                  badge={badge}
                  render={<Link to={to} />}
                  onClick={onNavigate}
                />
              );
            })}
          </SidebarNavGroup>
        );
      })}
    </AppSidebar>
  );
};

export default Sidebar;
