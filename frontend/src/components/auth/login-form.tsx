import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, Lock, Mail, ChartLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";
import { loginToasts } from "@/lib/login-toasts";
import { loginSchema, type LoginValues } from "@/lib/validations/login";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-label leading-snug text-danger-text">
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

  return (
    <div className="flex w-full flex-col">
      <div className="mb-9 flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand-gradient text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.6)]">
          {/* Thay bằng logo công ty */}
          <ChartLine aria-hidden="true" className="h-[18px] w-[18px]" />
        </div>
        <span className="text-base font-bold tracking-tight">KPI Performance</span>
      </div>

      {locked && (
        <FormAlert tone="error" title="Tài khoản tạm thời bị khóa" icon={<Lock aria-hidden="true" />} className="mb-6">
          Bạn đã nhập sai thông tin quá số lần cho phép. Vui lòng thử lại sau
          {lockLeft > 0 && (
            <>
              {" "}
              <strong className="tabular-nums text-foreground dark:text-white">{formatClock(lockLeft)}</strong>
            </>
          )}{" "}
          hoặc liên hệ phòng IT để mở khóa.
        </FormAlert>
      )}

      {success && (
        <FormAlert tone="success" className="mb-6">
          Đăng nhập thành công. Đang chuyển đến bảng điều khiển…
        </FormAlert>
      )}

      <h2 className="mb-2 text-title font-bold leading-tight tracking-[-0.025em] text-foreground">
        Chào mừng quay lại <span aria-hidden="true">👋</span>
      </h2>
      <p className="mb-8 text-body text-muted-foreground">Đăng nhập để xem hiệu suất của bạn</p>

      <form noValidate onSubmit={submit} aria-label="Đăng nhập" className="flex flex-col gap-5">
        <fieldset disabled={locked} className="contents">
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
              Email công ty hoặc mã nhân viên
            </Label>
            <Input
              id="identifier"
              type="text"
              size="lg"
              startIcon={<Mail />}
              autoComplete="username"
              placeholder="ten.ho@congty.vn hoặc NV00123"
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              {...register("identifier")}
            />
            <FieldError id="identifier-error" message={errors.identifier?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Mật khẩu
            </Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              size="lg"
              startIcon={<Lock />}
              endAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute right-[5px] top-1/2 h-[38px] w-[38px] -translate-y-1/2 rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 dark:hover:bg-white/[.06] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" /> : <Eye aria-hidden="true" className="h-[18px] w-[18px]" />}
                </Button>
              }
              autoComplete="current-password"
              placeholder="Tối thiểu 8 ký tự"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pr-12"
              {...register("password")}
            />
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
                    className="h-[18px] w-[18px] rounded-md border-[1.5px] border-placeholder focus-visible:ring-4 focus-visible:ring-brand/20 focus-visible:ring-offset-0"
                  />
                )}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-text-secondary">
                Ghi nhớ đăng nhập
              </Label>
            </div>
            <Link
              to="/quen-mat-khau"
              className="rounded-md text-sm font-medium text-brand-text underline-offset-4 hover:text-brand-text-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" size="xl" loading={isSubmitting} disabled={locked} className="mt-1 w-full">
            {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </fieldset>
      </form>

      <p className="mt-8 text-center text-label text-muted-foreground">
        Gặp sự cố?{" "}
        <a href="mailto:it@congty.vn" className="rounded font-medium text-brand-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          Liên hệ phòng IT
        </a>
      </p>
    </div>
  );
}
