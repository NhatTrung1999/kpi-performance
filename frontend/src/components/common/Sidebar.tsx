import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { getCurrentUser, initialsOf, ROLE_PORTAL } from "@/lib/session";
import { canAccess, NAV_GROUP_LABEL, ROUTE_META, type NavGroup } from "@/routes/config";

const GROUPS: NavGroup[] = ["main", "admin"];

const Sidebar = ({ className, onClose }: { className?: string; onClose?: () => void }) => {
  const user = getCurrentUser();
  const items = Object.entries(ROUTE_META).filter(([, m]) => m.nav && canAccess(m, user.role));
  return (
    <aside className={cn("sticky top-0 flex h-screen w-62 flex-none flex-col border-r border-border bg-card", className)}>
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-linear-to-br from-brand-from to-brand-to text-[15px] font-bold text-white">
          K
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[15px] font-bold">KPI Performance</span>
          <span className="text-xs text-muted-foreground">{ROLE_PORTAL[user.role]}</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon-lg" aria-label="Đóng menu" onClick={onClose}>
            <X />
          </Button>
        )}
      </div>
      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 px-3 py-4">
        {GROUPS.map((group) => {
          const groupItems = items.filter(([, m]) => m.nav!.group === group);
          if (groupItems.length === 0) return null;
          const label = NAV_GROUP_LABEL[group];
          return (
            <div key={group} role="group" aria-label={label ?? undefined} className="flex flex-col gap-1">
              {label && <span className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wider text-muted-foreground">{label}</span>}
              {groupItems.map(([to, { nav }]) => {
                const { label: text, icon: Icon, badge } = nav!;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex h-10 items-center gap-3 rounded-[10px] px-3 font-medium text-text-secondary transition-colors hover:bg-muted",
                        isActive && "bg-linear-to-r from-accent to-transparent font-semibold text-accent-foreground hover:bg-transparent"
                      )
                    }
                  >
                    <Icon aria-hidden="true" className="size-[18px]" />
                    <span className="flex-1">{text}</span>
                    {badge !== undefined && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-foreground tabular-nums">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="m-3 flex items-center gap-2.5 rounded-xl border border-border p-3">
        <div className="flex size-9 flex-none items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground">
          {initialsOf(user.name)}
        </div>
        <div className="flex min-w-0 flex-col leading-snug">
          <span className="truncate font-semibold">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.title || ROLE_PORTAL[user.role]}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
