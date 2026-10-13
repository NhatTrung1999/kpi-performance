import i18n from "@/i18n";

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
    console.error("Original error:", raw.error ?? raw.body);
    if (raw.status === 404) {
      console.warn(
        "404 from /auth/login. If a CORRECT account also gets 404, the API path is wrong — check VITE_API_URL and the endpoint."
      );
    }
    console.groupEnd();
  }
  return failure;
}

/* ───────── Câu chữ hiển thị (lấy từ i18n, namespace `errors`) ───────── */

export function invalidCredentialsMessage(attemptsLeft?: number) {
  return (
    i18n.t("errors:invalidCredentials") +
    (attemptsLeft !== undefined ? ` ${i18n.t("errors:attemptsLeft", { count: attemptsLeft })}` : "")
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
      return { title: i18n.t("errors:invalidTitle"), description: invalidCredentialsMessage(f.attemptsLeft), tone: "error", retry: false };
    case "locked": {
      const min = f.retryAfter ? Math.max(1, Math.ceil(f.retryAfter / 60)) : undefined;
      return {
        title: i18n.t("errors:lockedTitle"),
        description: min ? i18n.t("errors:lockedMinutes", { count: min }) : i18n.t("errors:lockedNoTime"),
        tone: "error",
        retry: false,
      };
    }
    case "rate-limited":
      return { title: i18n.t("errors:rateLimited"), tone: "warning", retry: false };
    case "unavailable":
      return { title: i18n.t("errors:unavailableTitle"), description: i18n.t("errors:unavailableDescription"), tone: "error", retry: true };
    default:
      return { title: i18n.t("errors:unknown"), tone: "error", retry: false };
  }
}
