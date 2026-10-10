/** Lỗi đăng nhập đã chuẩn hoá — UI chỉ làm việc với kiểu này, không bao giờ với lỗi thô từ server. */
export type LoginFailure =
  | { kind: "invalid"; attemptsLeft?: number }
  | { kind: "locked"; retryAfter?: number }
  | { kind: "rate-limited" }
  | { kind: "unavailable" } // 5xx, 408, mất mạng, quá thời gian chờ → có nút "Thử lại"
  | { kind: "unknown" };

interface RawFailure {
  status?: number;
  body?: unknown;
  error?: unknown;
}

function pick(body: unknown, ...keys: string[]): unknown {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  for (const k of keys) if (k in o) return o[k];
  return undefined;
}

const asNumber = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function classify({ status, body, error }: RawFailure): LoginFailure {
  if (error !== undefined) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError" || error instanceof TypeError) return { kind: "unavailable" };
    return { kind: "unknown" };
  }
  if (status === undefined) return { kind: "unknown" };

  const code = String(pick(body, "code", "error", "errorCode") ?? "");
  if (status === 423 || pick(body, "locked") === true || /lock/i.test(code)) {
    return { kind: "locked", retryAfter: asNumber(pick(body, "retryAfter", "retry_after")) };
  }
  // 404 cũng coi là sai thông tin: không tiết lộ tài khoản có tồn tại hay không.
  if (status === 400 || status === 401 || status === 404) {
    return { kind: "invalid", attemptsLeft: asNumber(pick(body, "attemptsLeft", "remainingAttempts", "attempts_left")) };
  }
  if (status === 429) return { kind: "rate-limited" };
  if (status === 408 || status >= 500) return { kind: "unavailable" };
  return { kind: "unknown" };
}

export function toLoginFailure(raw: RawFailure): LoginFailure {
  const failure = classify(raw);
  if (import.meta.env.DEV) {
    console.groupCollapsed(`[login] ${raw.status ?? (raw.error as Error)?.name ?? "error"} → ${failure.kind}`);
    console.error("Lỗi gốc:", raw.error ?? raw.body);
    if (raw.status === 404) {
      console.warn(
        "404 từ /auth/login. Nếu tài khoản ĐÚNG cũng nhận 404 thì đường dẫn API sai — kiểm tra VITE_API_URL và endpoint."
      );
    }
    console.groupEnd();
  }
  return failure;
}

/* ───────── Câu chữ hiển thị (tiếng Việt, thân thiện) ───────── */

export function invalidCredentialsMessage(attemptsLeft?: number) {
  return (
    "Email/mã nhân viên hoặc mật khẩu không đúng." +
    (attemptsLeft !== undefined ? ` Bạn còn ${attemptsLeft} lần thử.` : "")
  );
}

export function describeLoginFailure(f: LoginFailure): {
  title: string;
  description?: string;
  tone: "error" | "warning";
  retry: boolean;
} {
  switch (f.kind) {
    case "invalid":
      return { title: "Đăng nhập không thành công", description: invalidCredentialsMessage(f.attemptsLeft), tone: "error", retry: false };
    case "locked": {
      const min = f.retryAfter ? Math.max(1, Math.ceil(f.retryAfter / 60)) : undefined;
      return {
        title: "Tài khoản tạm thời bị khóa",
        description: min ? `Vui lòng thử lại sau ${min} phút hoặc liên hệ phòng IT.` : "Vui lòng liên hệ phòng IT để được hỗ trợ.",
        tone: "error",
        retry: false,
      };
    }
    case "rate-limited":
      return { title: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.", tone: "warning", retry: false };
    case "unavailable":
      return { title: "Không thể kết nối đến máy chủ", description: "Vui lòng kiểm tra mạng và thử lại.", tone: "error", retry: true };
    default:
      return { title: "Đã có lỗi xảy ra, vui lòng thử lại.", tone: "error", retry: false };
  }
}
