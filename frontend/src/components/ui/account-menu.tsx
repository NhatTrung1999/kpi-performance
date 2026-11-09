import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { useGlassPopup } from "@/hooks/use-is-desktop"

/** Ảnh đại diện chữ viết tắt trên ô kính mờ (cùng kiểu logo — `.app-avatar` trong index.css). */
function Avatar({ initials, size = "md", className }: { initials: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(
        "app-avatar flex flex-none items-center justify-center rounded-full font-bold select-none",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-9 text-[13px]",
        size === "lg" && "size-10 text-[13px]",
        className
      )}
    >
      {initials}
    </span>
  )
}

type AccountMenuItem = {
  key: string
  label: string
  icon?: React.ReactNode
  /** Phím tắt hiện bên phải, vd. "?". */
  shortcut?: string
  /** `danger` = chữ đỏ (Log out). */
  tone?: "default" | "danger"
  /** Kẻ ngang phía trên mục này. */
  separatorBefore?: boolean
  onSelect: () => void
}

type AccountMenuProps = {
  name: string
  initials: string
  /** Dòng phụ: chức danh. */
  title?: string
  email?: string
  items: AccountMenuItem[]
  /** Nhãn nút avatar cho trình đọc màn hình, vd. "Account menu". */
  triggerLabel?: string
  avatarSize?: "sm" | "md"
  className?: string
}

const itemClass =
  "flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none select-none [&>svg]:size-4 [&>svg]:flex-none"

/** Menu tài khoản ở avatar góc trên phải: họ tên, chức danh, email và các mục hành động. */
function AccountMenu({ name, initials, title, email, items, triggerLabel = "Account menu", avatarSize = "md", className }: AccountMenuProps) {
  const glass = useGlassPopup()
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={triggerLabel}
        className={cn(
          "flex-none rounded-full outline-none transition-shadow duration-150 hover:ring-3 hover:ring-brand/25 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:ring-3 data-popup-open:ring-brand/25",
          className
        )}
      >
        <Avatar initials={initials} size={avatarSize} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={16} className="z-50 outline-none">
          <Menu.Popup
            data-slot="account-menu"
            className={cn(
              "flex w-75 max-w-[calc(100vw-2rem)] origin-(--transform-origin) flex-col rounded-[14px] border border-border bg-popover p-1.5 text-popover-foreground shadow-toast outline-none transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              glass
            )}
          >
            <div className="flex items-start gap-3 px-2.5 pt-2.5 pb-3">
              <Avatar initials={initials} size="lg" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">{name}</span>
                {title && <span className="truncate text-xs text-text-secondary">{title}</span>}
                {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
              </div>
            </div>
            <Menu.Separator className="mx-1 mb-1 h-px bg-border" />
            {items.map((item) => (
              <React.Fragment key={item.key}>
                {item.separatorBefore && <Menu.Separator className="m-1 h-px bg-border" />}
                <Menu.Item
                  onClick={item.onSelect}
                  className={cn(
                    itemClass,
                    item.tone === "danger"
                      ? "font-medium text-danger-text data-highlighted:bg-danger-soft"
                      : "text-foreground data-highlighted:bg-muted"
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                </Menu.Item>
              </React.Fragment>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export { AccountMenu, Avatar }
export type { AccountMenuItem, AccountMenuProps }
