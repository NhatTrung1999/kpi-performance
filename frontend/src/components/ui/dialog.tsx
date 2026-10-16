import * as React from "react"
import { AlertDialog } from "@base-ui/react/alert-dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const backdropClass =
  "fixed inset-0 z-50 bg-black/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
const popupClass =
  "fixed top-1/2 left-1/2 z-50 flex w-100 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-toast outline-none transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  /** `danger` = nút xác nhận màu đỏ (vd. Log out, xoá). */
  tone?: "default" | "danger"
}

/** Hộp xác nhận chặn (alert dialog), vd. "You have unsaved changes". Tiêu điểm mặc định ở nút Cancel. */
function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, tone = "default" }: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdropClass} />
        <AlertDialog.Popup data-slot="confirm-dialog" className={popupClass}>
          <div className="flex gap-3.5">
            <div aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-warning-soft text-warning-text">
              <TriangleAlert className="size-5" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col gap-1.5">
              <AlertDialog.Title className="text-base font-semibold">{title}</AlertDialog.Title>
              {description && <AlertDialog.Description className="text-sm leading-normal text-muted-foreground">{description}</AlertDialog.Description>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="outline" size="lg" className="px-3.5" />}>{cancelLabel}</AlertDialog.Close>
            <Button variant={tone === "danger" ? "destructive" : "default"} size="lg" className="px-3.5" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  closeLabel?: string
  children?: React.ReactNode
  className?: string
}

/** Hộp thoại thông tin đơn giản (có nút X, đóng bằng Esc / bấm ra ngoài). */
function Dialog({ open, onOpenChange, title, description, closeLabel = "Close", children, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={backdropClass} />
        <DialogPrimitive.Popup data-slot="dialog" className={cn(popupClass, "gap-4", className)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="text-sm text-muted-foreground">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close render={<Button variant="ghost" size="icon" aria-label={closeLabel} className="-mt-1 -mr-2" />}>
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { ConfirmDialog, Dialog }
export type { ConfirmDialogProps, DialogProps }
