import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigUp, ArrowRight, CircleAlert, Eye, EyeOff, Lock, LogIn, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";
import { loginToasts } from "@/lib/login-toasts";
import { cn } from "@/lib/utils";
import { createLoginSchema, type LoginValues } from "@/lib/validations/login";

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
  const { t } = useTranslation(["auth", "common"]);
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const [showPassword, setShowPassword] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [capsOn, setCapsOn] = useState(false);
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

  const passwordField = register("password");
  // Cảnh báo Caps Lock khi gõ mật khẩu.
  const updateCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsOn(e.getModifierState("CapsLock"));

  const onSubmit = async (values: LoginValues) => {
    try {
      const result = await login(values); // không ném lỗi — mọi lỗi đã được chuẩn hoá
      if (result.ok) {
        // Thành công thì chuyển trang ngay, không hiện thông báo.
        loginToasts.clear();
        onSuccess?.(values);
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
    // `login-form`: ô nhập kiểu "nền đặc" (index.css) — nền xám xanh nhạt, không viền; focus thì nền thẻ + viền & vầng sáng thương hiệu.
    <div className="login-form flex w-full flex-col">
      {locked && (
        <FormAlert tone="error" title={t("lockedTitle")} icon={<Lock aria-hidden="true" />} className="mb-6 animate-slide-down">
          {lockLeft > 0 ? (
            <>
              {t("lockedBefore")}{" "}
              <strong className="tabular-nums text-foreground dark:text-white">{formatClock(lockLeft)}</strong>{" "}
              {t("lockedAfter")}
            </>
          ) : (
            t("lockedNoTimer")
          )}
        </FormAlert>
      )}

      <div className="mb-8 flex flex-col gap-5 max-lg:mb-5 [@media(max-height:760px)]:mb-5">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl max-lg:hidden [@media(max-height:760px)]:hidden bg-brand-gradient text-white shadow-brand [&>svg]:size-[22px]">
          <LogIn strokeWidth={2.2} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="animate-blur-in text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground">
            {t("welcome")} <span aria-hidden="true">👋</span>
          </h2>
          <p className="text-body text-muted-foreground [@media(max-height:600px)]:max-lg:hidden">{t("subtitle")}</p>
        </div>
      </div>

      <form noValidate onSubmit={submit} aria-label={t("formLabel")} className="flex flex-col gap-5 max-lg:gap-4">
        <fieldset disabled={locked} className="contents">
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
              {t("identifier")}
            </Label>
            <Input
              id="identifier"
              type="text"
              size="lg"
              startIcon={<UserRound />}
              autoComplete="username"
              placeholder={t("identifierPlaceholder")}
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              {...register("identifier")}
            />
            <FieldError id="identifier-error" message={errors.identifier?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                {t("password")}
              </Label>
              {capsOn && (
                <span role="status" className="flex animate-slide-down items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-text [animation-duration:220ms]">
                  <ArrowBigUp aria-hidden="true" className="size-3.5" />
                  {t("capsLock")}
                </span>
              )}
            </div>
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
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute right-[5px] top-1/2 h-[38px] w-[38px] -translate-y-1/2 rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 dark:hover:bg-white/[.06] dark:hover:text-white"
                >
                  <span aria-hidden="true" className="grid size-[18px] place-items-center">
                    <Eye className={cn("col-start-1 row-start-1 size-[18px] transition duration-200", showPassword && "scale-50 opacity-0")} />
                    <EyeOff className={cn("col-start-1 row-start-1 size-[18px] transition duration-200", !showPassword && "scale-50 opacity-0")} />
                  </span>
                </Button>
              }
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pr-12"
              {...passwordField}
              onKeyDown={updateCaps}
              onKeyUp={updateCaps}
              onBlur={(e) => {
                setCapsOn(false);
                void passwordField.onBlur(e);
              }}
            />
            <FieldError id="password-error" message={errors.password?.message} />
          </div>

          <div className="-mt-1 flex items-center">
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
                {t("remember")}
              </Label>
            </div>
          </div>

          {/* Nút đăng nhập: cao 52px, gradient xanh dương → xanh da trời (giữ xanh dương ở 1/3 đầu), viền sáng mảnh phía trên, vệt sáng lướt qua khi rê chuột,
              mũi tên trong ô tròn trắng mờ ở mép phải (trượt nhẹ khi rê). */}
          <Button
            type="submit"
            size="xl"
            loading={isSubmitting}
            disabled={locked}
            className={cn(
              "group/submit relative mt-1 h-[52px] w-full overflow-hidden rounded-[14px] bg-[linear-gradient(100deg,var(--brand-from)_0%,var(--brand-from)_30%,var(--brand-to)_100%)] text-[15px] tracking-[.01em]",
              "shadow-[inset_0_1px_0_rgb(255_255_255/.28),0_10px_24px_-10px_rgb(37_99_235/.7)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/.28),0_14px_30px_-10px_rgb(37_99_235/.8)]",
              "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/3 before:w-1/3 before:-skew-x-12 before:bg-white/25 before:opacity-0 before:transition-[left,opacity] before:duration-500 hover:before:left-[110%] hover:before:opacity-100 motion-reduce:before:hidden"
            )}
          >
            <span className="relative">{isSubmitting ? t("submitting") : t("submit")}</span>
            {!isSubmitting && (
              <span aria-hidden="true" className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-[10px] bg-white/18 transition-transform duration-200 group-hover/submit:translate-x-0.5">
                <ArrowRight className="size-[18px]" />
              </span>
            )}
          </Button>
        </fieldset>
      </form>

      <p className="mt-7 flex items-center gap-2 border-t border-border pt-5 max-lg:mt-5 max-lg:pt-4 [@media(max-height:760px)]:mt-5 [@media(max-height:760px)]:pt-4 [@media(max-height:660px)]:max-lg:hidden text-xs text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4 flex-none text-success-text" />
        {t("hero.footer")}
      </p>
    </div>
  );
}
