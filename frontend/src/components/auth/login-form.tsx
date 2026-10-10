import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail, ChartLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { login } from "@/lib/auth";
import { loginToasts } from "@/lib/login-toasts";
import { loginSchema, type LoginValues } from "@/lib/validations/login";

const inputClass = cn(
  "h-12 rounded-xl border-gray-200 bg-white pl-11 text-[15px] text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,.04)]",
  "placeholder:text-gray-400 transition-[border-color,box-shadow] duration-200",
  "hover:border-gray-300 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/15 focus-visible:ring-offset-0",
  "aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-600/10",
  "disabled:cursor-not-allowed disabled:opacity-55",
  "dark:border-white/10 dark:bg-[#15151C] dark:text-gray-100 dark:placeholder:text-gray-500 dark:shadow-none",
  "dark:hover:border-white/20 dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/20",
  "dark:aria-[invalid=true]:border-red-400 dark:aria-[invalid=true]:ring-red-400/15"
);

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-[13px] leading-snug text-red-600 dark:text-red-400">
      <CircleAlert aria-hidden="true" className="mt-px h-[15px] w-[15px] shrink-0" />
      {message}
    </p>
  );
}

function formatClock(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function LoginForm({ onSuccess }: { onSuccess?: (values: LoginValues) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(false);
  const inFlight = useRef(false);

  const {
    register,
    control,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
    shouldFocusError: true,
  });

  // Đếm ngược khi server trả về thời gian khóa; nếu không có thì khóa đến khi tải lại trang.
  useEffect(() => {
    if (!locked || lockLeft <= 0) return;
    const id = window.setInterval(() => {
      setLockLeft((s) => {
        if (s <= 1) setLocked(false);
        return Math.max(0, s - 1);
      });
    }, 1000);
    return () => clearInterval(id);
  }, [locked, lockLeft]);

  const onSubmit = async (values: LoginValues) => {
    setSuccess(false);
    try {
      const result = await login(values); // không ném lỗi — mọi lỗi đã được chuẩn hoá
      if (result.ok) {
        setSuccess(true);
        loginToasts.success();
        window.setTimeout(() => onSuccess?.(values), 800);
        return;
      }
      const { failure } = result;
      if (failure.kind === "locked") {
        resetField("password");
        setLockLeft(failure.retryAfter ?? 0);
        setLocked(true);
        return;
      }
      if (failure.kind === "invalid") setFocus("password");
      loginToasts.failure(failure, () => void handleSubmit(onSubmit)());
    } finally {
      inFlight.current = false;
    }
  };

  // Chống bấm liên tục / Enter lặp trong lúc đang gọi API.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (inFlight.current) {
      event.preventDefault();
      return;
    }
    inFlight.current = true;
    // Validate lỗi thì onSubmit không chạy → phải nhả khóa ở onInvalid.
    return handleSubmit(onSubmit, () => {
      inFlight.current = false;
    })(event);
  };

  const busy = isSubmitting || locked;

  return (
    <div className="flex w-full flex-col">
      <div className="mb-9 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.6)]">
          {/* Thay bằng logo công ty */}
          <ChartLine aria-hidden="true" className="h-[18px] w-[18px]" />
        </div>
        <span className="text-base font-bold tracking-tight">KPI Performance</span>
      </div>

      {locked && (
        <div role="alert" className="mb-6 flex gap-3 rounded-[14px] border border-red-100 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/[.07]">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-red-100 text-red-600 dark:bg-red-400/15 dark:text-red-400">
            <Lock aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-1">
            <strong className="text-sm font-semibold text-red-700 dark:text-red-300">Tài khoản tạm thời bị khóa</strong>
            <span className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
              Bạn đã nhập sai thông tin quá số lần cho phép. Vui lòng thử lại sau
              {lockLeft > 0 && (
                <>
                  {" "}
                  <strong className="tabular-nums text-gray-900 dark:text-white">{formatClock(lockLeft)}</strong>
                </>
              )}{" "}
              hoặc liên hệ phòng IT để mở khóa.
            </span>
          </div>
        </div>
      )}

      {success && (
        <div role="status" className="mb-6 flex items-center gap-2.5 rounded-[14px] bg-emerald-50 px-4 py-3.5 text-[13px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Check aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          Đăng nhập thành công. Đang chuyển đến bảng điều khiển…
        </div>
      )}

      <h2 className="mb-2 text-[30px] font-bold leading-tight tracking-[-0.025em] text-gray-900 dark:text-gray-100">
        Chào mừng quay lại <span aria-hidden="true">👋</span>
      </h2>
      <p className="mb-8 text-[15px] text-gray-500 dark:text-gray-400">Đăng nhập để xem hiệu suất của bạn</p>

      <form noValidate onSubmit={submit} aria-label="Đăng nhập" className="flex flex-col gap-5">
        <fieldset disabled={locked} className="contents">
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Email công ty hoặc mã nhân viên
            </Label>
            <div className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-[15px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="ten.ho@congty.vn hoặc NV00123"
                aria-invalid={!!errors.identifier}
                aria-describedby={errors.identifier ? "identifier-error" : undefined}
                className={inputClass}
                {...register("identifier")}
              />
            </div>
            <FieldError id="identifier-error" message={errors.identifier?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Mật khẩu
            </Label>
            <div className="relative">
              <Lock aria-hidden="true" className="pointer-events-none absolute left-[15px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tối thiểu 8 ký tự"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={cn(inputClass, "pr-12")}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                aria-controls="password"
                className="absolute right-[5px] top-1/2 h-[38px] w-[38px] -translate-y-1/2 rounded-[9px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 dark:text-gray-400 dark:hover:bg-white/[.06] dark:hover:text-white"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" /> : <Eye aria-hidden="true" className="h-[18px] w-[18px]" />}
              </Button>
            </div>
            <FieldError id="password-error" message={errors.password?.message} />
          </div>

          <div className="-mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-h-11 items-center gap-2.5">
              <Controller
                control={control}
                name="remember"
                render={({ field }) => (
                  <Checkbox
                    id="remember"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v)}
                    className="h-[18px] w-[18px] rounded-md border-[1.5px] border-gray-400 data-checked:border-transparent data-checked:bg-gradient-to-br data-checked:from-indigo-600 data-checked:to-blue-600 data-checked:text-white focus-visible:ring-4 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0 dark:border-gray-500"
                  />
                )}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300">
                Ghi nhớ đăng nhập
              </Label>
            </div>
            <Link
              to="/quen-mat-khau"
              className="rounded-md text-sm font-medium text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={busy}
            aria-busy={isSubmitting}
            className={cn(
              "mt-1 h-12 w-full gap-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-[15px] font-semibold text-white",
              "shadow-[0_10px_24px_-10px_rgba(79,70,229,.55),0_2px_6px_-2px_rgba(37,99,235,.25)] transition-all duration-200",
              "hover:-translate-y-px hover:brightness-110 hover:shadow-[0_16px_32px_-12px_rgba(79,70,229,.6),0_4px_10px_-4px_rgba(37,99,235,.3)]",
              "active:translate-y-0 active:brightness-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-100 [&:disabled:not([aria-busy=true])]:opacity-50",
              "dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,.08),0_10px_30px_-8px_rgba(99,102,241,.65)] dark:focus-visible:ring-offset-[#0B0B0F]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden="true" className="h-[18px] w-[18px] animate-spin" />
                Đang đăng nhập…
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </fieldset>
      </form>

      <p className="mt-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
        Gặp sự cố?{" "}
        <a href="mailto:it@congty.vn" className="rounded font-medium text-indigo-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
          Liên hệ phòng IT
        </a>
      </p>
    </div>
  );
}
