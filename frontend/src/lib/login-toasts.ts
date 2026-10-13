import { toast } from "sonner";
import i18n from "@/i18n";
import { describeLoginFailure, type LoginFailure } from "./auth-errors";

/**
 * Mọi lỗi đăng nhập từ server (sai thông tin, mất mạng, 429, lỗi lạ) → toast.
 * Lỗi validate từng ô vẫn hiện dưới ô; trạng thái khóa có banner đếm ngược trong form.
 * id cố định cho từng loại → bấm liên tục chỉ cập nhật một toast, không xếp chồng.
 */
type ToastFailure = Exclude<LoginFailure, { kind: "locked" }>;

const ID: Record<ToastFailure["kind"] | "warning" | "success", string> = {
  invalid: "login-invalid",
  warning: "login-warning",
  "rate-limited": "login-rate-limited",
  unavailable: "login-unavailable",
  unknown: "login-unknown",
  success: "login-success",
};

const DURATION = 5000;
/** Tắt các toast khác, giữ lại `keep`: tắt rồi tạo lại cùng id trong một nhịp sẽ làm toast mới biến mất. */
const dismissExcept = (...keep: string[]) =>
  Object.values(ID).forEach((id) => !keep.includes(id) && toast.dismiss(id));

const isToastFailure = (f: LoginFailure): f is ToastFailure => f.kind !== "locked";

export const loginToasts = {
  failure(failure: LoginFailure, onRetry: () => void) {
    if (!isToastFailure(failure)) return; // khóa tài khoản có banner riêng trong form
    dismissExcept(ID[failure.kind], ...(failure.kind === "invalid" ? [ID.warning] : []));
    if (failure.kind !== "invalid") toast.dismiss(ID.warning);
    const { title, description, tone, retry } = describeLoginFailure(failure);
    const show = tone === "warning" ? toast.warning : toast.error;
    show(title, {
      id: ID[failure.kind],
      description,
      duration: DURATION,
      action: retry
        ? {
            label: i18n.t("errors:retry"),
            onClick: () => {
              toast.dismiss(ID[failure.kind]);
              onRetry();
            },
          }
        : undefined,
    });

    if (failure.kind === "invalid" && failure.attemptsLeft !== undefined && failure.attemptsLeft <= 2) {
      toast.warning(i18n.t("errors:lastAttempts", { count: failure.attemptsLeft }), {
        id: ID.warning,
        description: i18n.t("errors:lastAttemptsHint"),
        duration: DURATION,
      });
    } else {
      toast.dismiss(ID.warning);
    }
  },

  success() {
    dismissExcept(ID.success);
    toast.success(i18n.t("auth:successToast"), { id: ID.success, duration: 1500 });
  },
};
